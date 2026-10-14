import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type pg from 'pg';
export const migrationDirectory = fileURLToPath(
  new URL('./migrations/', import.meta.url),
);
export async function migrate(
  pool: pg.Pool,
  directory = migrationDirectory,
): Promise<string[]> {
  const filenames = (await readdir(directory))
    .filter((name) => /^\d{3}_[a-z0-9_]+\.sql$/.test(name))
    .sort();
  if (!filenames.length) throw new Error('No SQL migrations found');
  const files = await Promise.all(
    filenames.map(async (name) => {
      const sql = await readFile(`${directory}/${name}`, 'utf8');
      return {
        name,
        sql,
        checksum: createHash('sha256').update(sql).digest('hex'),
      };
    }),
  );
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(73498125)');
    await client.query(
      'CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())',
    );
    const existing = await client.query<{ name: string; checksum: string }>(
      'SELECT name, checksum FROM schema_migrations ORDER BY name',
    );
    const known = new Map(files.map((f) => [f.name, f]));
    for (const row of existing.rows) {
      if (known.get(row.name)?.checksum !== row.checksum)
        throw new Error('Applied migration missing or checksum changed');
    }
    const applied = new Set(existing.rows.map((r) => r.name));
    const pending = files.filter((f) => !applied.has(f.name));
    if (pending.some((f) => f.name < (existing.rows.at(-1)?.name ?? '')))
      throw new Error('Out-of-order migration');
    for (const f of pending) {
      await client.query(f.sql);
      await client.query(
        'INSERT INTO schema_migrations(name, checksum) VALUES ($1, $2)',
        [f.name, f.checksum],
      );
    }
    // Runtime has data privileges only, never ownership or schema DDL.
    await client.query(
      "DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'seatwise_app') THEN GRANT USAGE ON SCHEMA public TO seatwise_app; GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO seatwise_app; REVOKE ALL ON schema_migrations FROM seatwise_app; END IF; END $$",
    );
    await client.query('COMMIT');
    return pending.map((f) => f.name);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

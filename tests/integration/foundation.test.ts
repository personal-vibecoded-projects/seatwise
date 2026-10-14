import { mkdtemp, copyFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  createPool,
  databaseHealth,
  migrate,
  seed,
} from '../../packages/db/src/index.js';
import { migrationDirectory } from '../../packages/db/src/migrate.js';
import { fixtureId } from '../../packages/db/src/seed.js';
import { isolatedDatabase } from '../../packages/test-support/src/index.js';
import { buildApp } from '../../apps/api/src/app.js';
describe('PostgreSQL foundation', () => {
  it('migrates fresh and repeat runs, seeds isolated tenants without credentials, and enforces constraints', async () => {
    const db = await isolatedDatabase();
    try {
      expect(await migrate(db.pool)).toEqual(['001_foundation.sql']);
      expect(await migrate(db.pool)).toEqual([]);
      await seed(db.pool, db.url, 'test');
      await seed(db.pool, db.url, 'test');
      expect(
        (await db.pool.query('SELECT count(*)::int AS n FROM workspaces'))
          .rows[0].n,
      ).toBe(2);
      expect(
        (
          await db.pool.query(
            'SELECT count(*)::int AS n FROM users WHERE password_hash IS NULL',
          )
        ).rows[0].n,
      ).toBe(6);
      expect(
        (await db.pool.query('SELECT count(*)::int AS n FROM resources'))
          .rows[0].n,
      ).toBe(8);
      expect(
        (
          await db.pool.query(
            'SELECT role FROM memberships WHERE user_id=$1 ORDER BY workspace_id',
            [fixtureId('user:0')],
          )
        ).rows
          .map((r) => r.role)
          .sort(),
      ).toEqual(['admin', 'member']);
      await expect(
        db.pool.query(
          "INSERT INTO resources(id,workspace_id,kind,name,capacity) VALUES ($1,$2,'desk','Bad desk',2)",
          [fixtureId('bad'), fixtureId('harbor-studio')],
        ),
      ).rejects.toMatchObject({ code: '23514' });
      await expect(
        db.pool.query(
          "INSERT INTO memberships(workspace_id,user_id,role) VALUES ($1,$2,'member')",
          [fixtureId('missing'), fixtureId('user:0')],
        ),
      ).rejects.toMatchObject({ code: '23503' });
      await expect(
        db.pool.query('INSERT INTO opening_hours VALUES ($1,7,1000,500)', [
          fixtureId('harbor-studio'),
        ]),
      ).rejects.toMatchObject({ code: '23514' });
      expect(
        (
          await db.pool.query(
            "SELECT extname FROM pg_extension WHERE extname='btree_gist'",
          )
        ).rowCount,
      ).toBe(1);
    } finally {
      await db.close();
    }
  });
  it('rolls back all pending schema changes after failure and rejects checksum drift', async () => {
    const db = await isolatedDatabase();
    const dir = await mkdtemp(join(tmpdir(), 'seatwise-migrations-'));
    try {
      await copyFile(
        join(migrationDirectory, '001_foundation.sql'),
        join(dir, '001_foundation.sql'),
      );
      await writeFile(
        join(dir, '002_failure.sql'),
        'CREATE TABLE rollback_probe(id integer); SELECT * FROM intentionally_missing_table;',
      );
      await expect(migrate(db.pool, dir)).rejects.toMatchObject({
        code: '42P01',
      });
      expect(
        (
          await db.pool.query(
            "SELECT to_regclass('public.users') AS users, to_regclass('public.rollback_probe') AS probe, to_regclass('public.schema_migrations') AS migrations",
          )
        ).rows[0],
      ).toEqual({ users: null, probe: null, migrations: null });
      await rm(join(dir, '002_failure.sql'));
      await migrate(db.pool, dir);
      await writeFile(join(dir, '001_foundation.sql'), 'SELECT 1;');
      await expect(migrate(db.pool, dir)).rejects.toThrow('checksum');
    } finally {
      await db.close();
      await rm(dir, { recursive: true, force: true });
    }
  });
  it('serializes independent migration runners without duplicate application', async () => {
    const db = await isolatedDatabase();
    const other = createPool(db.url);
    try {
      const results = await Promise.all([migrate(db.pool), migrate(other)]);
      expect(results.flat()).toEqual(['001_foundation.sql']);
    } finally {
      await other.end();
      await db.close();
    }
  });
  it('checks real database readiness, handles unreachable database, and closes its pool', async () => {
    const db = await isolatedDatabase();
    const pool = createPool(db.url);
    const app = await buildApp(databaseHealth(pool));
    try {
      expect((await app.inject('/health/ready')).statusCode).toBe(200);
    } finally {
      await app.close();
    }
    expect(pool.ended).toBe(true);
    const unavailable = new URL(db.url);
    unavailable.port = '1';
    const bad = createPool(unavailable.toString());
    const failing = await buildApp(databaseHealth(bad));
    try {
      expect((await failing.inject('/health/live')).statusCode).toBe(200);
      expect((await failing.inject('/health/ready')).json()).toEqual({
        status: 'unavailable',
      });
    } finally {
      await failing.close();
      await db.close();
    }
  });
  it('gives the runtime principal data privileges while denying schema changes and migration metadata', async () => {
    const db = await isolatedDatabase();
    try {
      await migrate(db.pool);
      await seed(db.pool, db.url, 'test');
      const client = await db.pool.connect();
      try {
        await client.query('SET ROLE seatwise_app');
        expect(
          (await client.query('SELECT count(*)::int AS n FROM workspaces'))
            .rows[0].n,
        ).toBe(2);
        await expect(
          client.query('CREATE TABLE forbidden_ddl(id integer)'),
        ).rejects.toMatchObject({ code: '42501' });
        await expect(
          client.query('DELETE FROM schema_migrations'),
        ).rejects.toMatchObject({ code: '42501' });
      } finally {
        await client.query('RESET ROLE');
        client.release();
      }
    } finally {
      await db.close();
    }
  });
});

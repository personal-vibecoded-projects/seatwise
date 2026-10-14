import { createPool, requireDatabaseUrl, migrate } from './index.js';
const pool = createPool(requireDatabaseUrl('MIGRATION_DATABASE_URL'));
try {
  const applied = await migrate(pool);
  console.log(`Migrations applied: ${applied.length}`);
} catch {
  console.error('Migration failed; no pending schema changes committed.');
  process.exitCode = 1;
} finally {
  await pool.end();
}

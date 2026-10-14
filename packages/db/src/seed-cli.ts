import { createPool, requireDatabaseUrl, seed } from './index.js';
const url = requireDatabaseUrl('MIGRATION_DATABASE_URL');
const pool = createPool(url);
try {
  await seed(pool, url, process.env.APP_ENV);
  console.log('Synthetic fixtures ready. Accounts have no usable passwords.');
} catch {
  console.error('Seed failed. Use a migrated, designated local demo database.');
  process.exitCode = 1;
} finally {
  await pool.end();
}

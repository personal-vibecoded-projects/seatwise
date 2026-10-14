import pg from 'pg';
export function createPool(connectionString: string): pg.Pool {
  return new pg.Pool({
    connectionString,
    max: 10,
    connectionTimeoutMillis: 1500,
    idleTimeoutMillis: 10000,
    statement_timeout: 5000,
    lock_timeout: 2000,
    application_name: 'seatwise',
  });
}
export interface DatabaseHealth {
  check(): Promise<void>;
  close(): Promise<void>;
}
export function databaseHealth(pool: pg.Pool): DatabaseHealth {
  return {
    check: async () => {
      await pool.query('SELECT 1');
    },
    close: () => pool.end(),
  };
}
export function requireDatabaseUrl(name = 'DATABASE_URL'): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}
export { migrate } from './migrate.js';
export { seed } from './seed.js';

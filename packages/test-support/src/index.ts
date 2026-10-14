import { randomBytes } from 'node:crypto';
import { createPool } from '../../db/src/index.js';
import type { Clock } from '../../domain/src/index.js';
export class FixedClock implements Clock {
  constructor(private instant: Date) {}
  now(): Date {
    return new Date(this.instant);
  }
  set(instant: Date): void {
    this.instant = new Date(instant);
  }
}
export async function isolatedDatabase() {
  const url = process.env.TEST_DATABASE_ADMIN_URL;
  if (!url) throw new Error('TEST_DATABASE_ADMIN_URL is required');
  const parsed = new URL(url);
  if (
    !['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname) ||
    parsed.pathname !== '/postgres'
  )
    throw new Error(
      'Integration tests require a local postgres administration database',
    );
  const admin = createPool(url);
  const name = `seatwise_test_${randomBytes(8).toString('hex')}`;
  try {
    await admin.query(`CREATE DATABASE ${name}`);
  } catch (error) {
    await admin.end();
    throw error;
  }
  parsed.pathname = `/${name}`;
  const pool = createPool(parsed.toString());
  return {
    pool,
    url: parsed.toString(),
    async close() {
      await pool.end();
      try {
        await admin.query(`DROP DATABASE ${name} WITH (FORCE)`);
      } finally {
        await admin.end();
      }
    },
  };
}

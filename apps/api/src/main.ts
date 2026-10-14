import {
  createPool,
  databaseHealth,
  requireDatabaseUrl,
} from '../../../packages/db/src/index.js';
import { buildApp } from './app.js';
const pool = createPool(requireDatabaseUrl());
pool.on('error', () => {
  console.error('Database connection unavailable.');
});
const app = await buildApp(databaseHealth(pool), true);
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.once(signal, () => {
    void app.close().catch(() => {
      process.exitCode = 1;
    });
  });
try {
  await app.listen({
    host: process.env.API_HOST ?? '127.0.0.1',
    port: Number(process.env.API_PORT ?? 3001),
  });
} catch {
  console.error('API startup failed.');
  await app.close();
  process.exitCode = 1;
}

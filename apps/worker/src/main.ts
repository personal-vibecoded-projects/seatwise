import {
  createPool,
  requireDatabaseUrl,
} from '../../../packages/db/src/index.js';
import { systemClock } from '../../../packages/domain/src/index.js';
const pool = createPool(requireDatabaseUrl());
pool.on('error', () =>
  console.error('Worker database connection unavailable.'),
);
let stopping = false;
let wake: (() => void) | undefined;
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.once(signal, () => {
    stopping = true;
    wake?.();
  });
try {
  while (!stopping) {
    try {
      await pool.query('SELECT 1');
      console.log(
        JSON.stringify({
          event: 'worker_heartbeat',
          at: systemClock.now().toISOString(),
        }),
      );
    } catch {
      console.error('Worker database check failed.');
    }
    if (!stopping)
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, 15000);
        wake = () => {
          clearTimeout(timer);
          resolve();
        };
      });
  }
} finally {
  await pool.end();
}

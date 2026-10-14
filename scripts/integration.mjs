import { spawn } from 'node:child_process';
if (!process.env.TEST_DATABASE_ADMIN_URL) {
  console.error(
    'TEST_DATABASE_ADMIN_URL is required; run local:configure and start PostgreSQL.',
  );
  process.exit(1);
}
const child = spawn(
  process.execPath,
  ['node_modules/vitest/vitest.mjs', 'run', '--project', 'integration'],
  { stdio: 'inherit', env: { ...process.env, APP_ENV: 'test' } },
);
child.on('error', () => {
  console.error('Integration runner failed to start.');
  process.exitCode = 1;
});
child.on('exit', (code) => {
  process.exitCode = code ?? 1;
});

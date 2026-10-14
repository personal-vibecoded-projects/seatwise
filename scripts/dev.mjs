import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
const commands = [
  ['--import', 'tsx', 'apps/api/src/main.ts'],
  ['--import', 'tsx', 'apps/worker/src/main.ts'],
  [
    resolve('apps/web/node_modules/vite/bin/vite.js'),
    '--host',
    '0.0.0.0',
    '--port',
    process.env.WEB_PORT ?? '5173',
    '--strictPort',
  ],
];
let stopping = false;
const children = commands.map((args, index) =>
  spawn(process.execPath, args, {
    stdio: 'inherit',
    ...(index === 2 ? { cwd: 'apps/web' } : {}),
  }),
);
// Vite's executable path is relative to the web cwd.
function stop(code) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  for (const child of children) child.kill('SIGTERM');
  const timer = setTimeout(() => {
    for (const child of children) child.kill('SIGKILL');
  }, 10000);
  timer.unref();
}
for (const child of children) {
  child.on('error', () => stop(1));
  child.on('exit', (code) => {
    if (!stopping) stop(code ?? 1);
  });
}
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => stop(0));

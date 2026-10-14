import { cp, mkdir, symlink, rm } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
await cp('packages/db/src/migrations', 'dist/packages/db/src/migrations', {
  recursive: true,
});
for (const workspace of [
  'apps/api',
  'apps/worker',
  'packages/contracts',
  'packages/domain',
  'packages/db',
  'packages/test-support',
]) {
  const directory = resolve('dist', workspace);
  await mkdir(directory, { recursive: true });
  const link = resolve(directory, 'node_modules');
  await rm(link, { force: true, recursive: true });
  await symlink(
    relative(directory, resolve(workspace, 'node_modules')),
    link,
    'dir',
  );
}

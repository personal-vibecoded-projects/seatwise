import { randomBytes } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
const admin = randomBytes(24).toString('hex');
const runtime = randomBytes(24).toString('hex');
const content = `APP_ENV=local
API_HOST=127.0.0.1
API_PORT=3001
WEB_PORT=5173
POSTGRES_USER=seatwise_migrator
POSTGRES_DB=seatwise_demo
POSTGRES_PASSWORD=${admin}
RUNTIME_DB_PASSWORD=${runtime}
DATABASE_URL=postgresql://seatwise_app:${runtime}@127.0.0.1:5432/seatwise_demo
MIGRATION_DATABASE_URL=postgresql://seatwise_migrator:${admin}@127.0.0.1:5432/seatwise_demo
TEST_DATABASE_ADMIN_URL=postgresql://seatwise_migrator:${admin}@127.0.0.1:5432/postgres
`;
try {
  await writeFile('.env', content, { mode: 0o600, flag: 'wx' });
  console.log(
    'Local configuration created in ignored .env. No credentials printed.',
  );
} catch (error) {
  if (error.code === 'EEXIST') {
    console.error('.env already exists; kept existing configuration.');
  } else {
    console.error('Could not create local configuration.');
  }
  process.exitCode = 1;
}

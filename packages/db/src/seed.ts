import { createHash } from 'node:crypto';
import type pg from 'pg';
export function fixtureId(key: string): string {
  const h = createHash('sha256').update(`seatwise:${key}`).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
export function assertLocalTarget(
  url: string,
  environment: string | undefined,
  test = false,
): void {
  const parsed = new URL(url);
  const allowed = ['127.0.0.1', 'localhost', '[::1]', 'db'];
  const name = decodeURIComponent(parsed.pathname.slice(1));
  if (
    !['local', 'test'].includes(environment ?? '') ||
    !allowed.includes(parsed.hostname) ||
    !(test ? /^seatwise_test_[a-z0-9_]+$/.test(name) : name === 'seatwise_demo')
  )
    throw new Error('Operation requires a designated local demo/test database');
}
export async function seed(
  pool: pg.Pool,
  connectionString: string,
  environment: string | undefined,
): Promise<void> {
  assertLocalTarget(connectionString, environment, environment === 'test');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(73498125)');
    const workspaces = [
      {
        slug: 'harbor-studio',
        name: 'Harbor Studio',
        timezone: 'America/New_York',
      },
      { slug: 'garden-works', name: 'Garden Works', timezone: 'Europe/London' },
    ];
    for (let i = 0; i < 6; i++)
      await client.query(
        'INSERT INTO users(id,email,display_name) VALUES ($1,$2,$3) ON CONFLICT (id) DO NOTHING',
        [
          fixtureId(`user:${i}`),
          `person${i + 1}@example.test`,
          [
            'Alex Reed',
            'Morgan Bell',
            'Robin Vale',
            'Jamie Moss',
            'Taylor Brook',
            'Casey Finch',
          ][i],
        ],
      );
    for (const [index, w] of workspaces.entries()) {
      const wid = fixtureId(w.slug);
      await client.query(
        'INSERT INTO workspaces(id,slug,name,timezone) VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO NOTHING',
        [wid, w.slug, w.name, w.timezone],
      );
      for (let i = 0; i < 6; i++)
        await client.query(
          'INSERT INTO memberships(workspace_id,user_id,role) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
          [wid, fixtureId(`user:${i}`), i === index ? 'admin' : 'member'],
        );
      for (const [name, kind, capacity] of [
        ['The Boardroom', 'room', 8],
        ['Focus Room', 'room', 3],
        ['Window Desk', 'desk', 1],
        ['Quiet Desk', 'desk', 1],
      ] as const)
        await client.query(
          'INSERT INTO resources(id,workspace_id,name,kind,capacity,amenities) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING',
          [
            fixtureId(`${w.slug}:${name}`),
            wid,
            name,
            kind,
            capacity,
            kind === 'room' ? ['display', 'whiteboard'] : ['power'],
          ],
        );
      for (let day = 1; day <= 5; day++)
        await client.query(
          'INSERT INTO opening_hours(workspace_id,weekday,opens_at_minute,closes_at_minute) VALUES ($1,$2,540,1080) ON CONFLICT DO NOTHING',
          [wid, day],
        );
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

# Local operations

See README for ordered install, configure, database startup, migration, seed, and service commands. Secrets live in `.env`; do not publish the output of `docker compose config`, container inspection, or connection strings.

## Health and shutdown

- `GET /health/live` on the API: process is serving requests.
- `GET /health/ready` and `/api/v1/health/ready`: bounded database connection/query check; returns `ok` or a safe `unavailable` with HTTP 503.
- `/api/v1/openapi`: generated contracts.
- Worker emits a UTC heartbeat on each successful 15-second database check and a generic failure message otherwise.
- SIGINT/SIGTERM stop the API and close the pool. Worker cancels its wait, finishes its current bounded query, and closes its pool. `pnpm dev` forwards shutdown to all children, with a ten-second fallback deadline.

Logs contain request ID, route template, HTTP status, duration, and safe process events. Booking conflict, lock-wait and job-lag diagnostics arrive with the respective slices; none are claimed in the foundation.

## Migration discipline

Add ordered `NNN_description.sql` migrations. Never modify applied SQL. The runner checks historical names and checksums, rejects out-of-order additions, and serializes independent runners. A failed batch rolls back all pending files including metadata changes. Production-style startup runs migrations first using the owner principal and never seeds. There are no automatic destructive down migrations. Keep installed workspace dependencies alongside compiled output.

## Local data

`pnpm db:seed` adds fictional fixtures only and does not delete or change existing records. Seed records have stable UUIDs and reserved `example.test` email addresses. No accounts can log in before PR 2 provisioning. Reset/deletion requires a separate explicit local operation; no reset endpoint exists. Stop containers with `docker compose --env-file .env -f infra/compose.yaml down`; this retains data.

## Sandbox-specific constraints

The cloud sandbox may deny workspace bind mounts and container bridge networking. If observed, copy the checked-in init script into a task-owned stopped PostgreSQL container with `docker cp`, then start it with host networking and a task-owned volume. Do not change the checked-in Compose topology to fit those sandbox constraints. Record which topology was actually verified. Ordinary machines and CI use the documented Compose path.

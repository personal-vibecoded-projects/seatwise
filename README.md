# SeatWise

Make room for good work. A coworking reservation application built in twelve reviewable slices.

**Current slice: PR 1 — foundation.** Web, API, worker, transactional migrations, synthetic seed infrastructure, and health checks are implemented. Login and reservation features arrive in later slices. No PR has been opened or merged yet.

## Toolchain

- Node **24.14.1** (LTS); install via your Node version manager using `.node-version` / `.nvmrc`.
- pnpm **10.34.5**: `npm install --global pnpm@10.34.5`.
- Docker Engine with Docker Compose v2 or later, for PostgreSQL **18.6**.
- Exact dependency versions and the committed lockfile are authoritative. Container base images and CI actions use immutable digests/SHAs.

## Local startup

Run from the repository root:

```sh
pnpm install --frozen-lockfile
pnpm local:configure
docker compose --env-file .env -f infra/compose.yaml up -d --wait db
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open **http://localhost:5173**. Vite serves the browser app and proxies `/api` to the API at `127.0.0.1:3001`. The status card checks the API and PostgreSQL through that same origin. The worker checks the database every 15 seconds; domain jobs arrive in PR 9. Press Ctrl+C to stop all three processes. Restart `pnpm dev` after server-source changes; Vite reloads web changes automatically.

`local:configure` writes random database credentials into an ignored, mode-0600 `.env`, refuses to overwrite it, and never prints credentials. `.env.example` contains placeholders only. Retain `.env` while retaining the database volume: changing its passwords does not change credentials in an existing database. This configuration is for isolated local development only.

The migration principal owns schema; `seatwise_app` has data privileges only. The migration command uses `MIGRATION_DATABASE_URL`, while API and worker use `DATABASE_URL`. Tests use `TEST_DATABASE_ADMIN_URL` to create and drop uniquely named isolated databases on the local server. Never point those URLs at shared or real customer data.

Seeding is explicit and additive; repeated runs do not duplicate fixtures. It only runs with `APP_ENV=local|test` against designated local databases. Two fictional workspaces, two admins, four members, rooms, desks, and weekday opening hours are created. One user is admin in one workspace and member in the other. **All seeded accounts have no usable password.** The hidden terminal password provisioning flow is part of PR 2; there are no demo passwords to copy into chat.

## Checks

```sh
pnpm check                 # formatting, lint, strict TypeScript, unit tests
pnpm test:integration      # real PostgreSQL; isolated databases
pnpm build                 # web bundle and runnable API/worker output
pnpm exec playwright install chromium
pnpm test:e2e              # browser → API → database; starts dev if needed
pnpm audit --audit-level=moderate
```

CI runs every gate on pushes and pull requests using ephemeral, locally generated database credentials. Run `pnpm format` before `pnpm check` after edits. SQL migrations are immutable, checksum-verified, serialized with an advisory lock, and all pending migrations commit or roll back together. A second migration run is a no-op. Do not edit an applied migration; add the next numbered file.

After a build, `pnpm start:api` and `pnpm start:worker` run compiled output. The build copies SQL migrations and links each output workspace to its installed dependencies; retain the installed workspace and `dist` together.

## Production-style local containers

```sh
docker compose --env-file .env -f infra/compose.yaml up --build -d --wait
```

Open **http://localhost:8080**. Nginx serves static assets and proxies `/api` on the same origin; API and worker have no published ports. Migrations run before API startup. Startup does **not** seed. Container processes use `APP_ENV=production`; no public reset endpoint exists. This is a local topology demonstration, not a deployment.

```sh
docker compose --env-file .env -f infra/compose.yaml down
```

This stops containers and preserves the database volume. There is deliberately no destructive reset script in this slice.

## Documentation

- [Architecture](docs/architecture.md) and [foundation decision](docs/decisions/001-foundation.md)
- [Operations](docs/operations.md)
- [Demo guide](docs/demo-guide.md) and [observed review log](docs/review-log.md)
- [Delivery status](docs/delivery-plan.md)

No real user data, paid services, deployment, or PR merges are authorized by this project handoff.

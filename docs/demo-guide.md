# Foundation demonstration

This guide covers slice 1 only. Login and scheduling demonstrations will be added after those slices are implemented.

1. Follow the clean startup steps in README.
2. Open http://localhost:5173. The landing screen reports the actual browser → API → PostgreSQL readiness result.
3. Request `/api/v1/health/ready` through the web origin; expect `{ "status": "ok" }`. Open `/api/v1/openapi` to inspect the generated contract.
4. Run `pnpm db:migrate` again; expect zero new migrations.
5. Run `pnpm db:seed` again; fictional records remain unique, without usable passwords.
6. Stop the task-owned database. Readiness changes to HTTP 503 with a safe `unavailable`; API liveness remains HTTP 200. Restart the database and use Try again if needed.
7. Run `pnpm test:integration` to demonstrate real migration rollback, two-tenant fixtures, runtime role isolation, and readiness checks.
8. Stop the app with Ctrl+C; connections close. Data is retained when containers stop.

## PR evidence

Repository: https://github.com/personal-vibecoded-projects/seatwise

PR URL: not available; opening PRs requires Full access in this task. Validation evidence and observed results belong in [review-log.md](review-log.md). No review findings or PR URLs are fabricated.

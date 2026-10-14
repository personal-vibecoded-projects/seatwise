# ADR 001: Reproducible modular monolith

Status: accepted for the foundation implementation, 2026-10-14.

Use Node 24.14.1 LTS, pnpm 10.34.5, PostgreSQL 18.6, strict TypeScript 5.9.3, React 19, Fastify 5 with TypeBox contracts, Vite, Vitest, and Playwright. Verify exact versions in manifests and the lockfile. Runtime compatibility was checked against package engine/peer metadata, the Node release schedule, Fastify LTS documentation, and Vite/Vitest guides. PostgreSQL 18 is supported through 2030; its pinned 18.6 image includes `btree_gist`.

Keep web/API/worker separate while sharing domain contracts. Use SQL migrations in lexical numbered order, check applied checksums, and run pending files in one transaction under a PostgreSQL advisory lock. Preserve data on failure and detect accidental history edits. Migration checks and seed fixtures use actual PostgreSQL, rather than an in-memory substitute.

Use additive, explicit, local seed provisioning. Seed accounts have null password hashes. Generate local database passwords into ignored configuration; no password values are committed. Separate runtime and migration roles even in local development. No infrastructure purchase or deployment is needed.

Package maturity is constrained to at least one day in pnpm configuration. CI actions and container images are pinned by commit/digest. CI uses read-only repository permissions and never `pull_request_target`.

References verified during implementation:

- https://nodejs.org/en/about/previous-releases
- https://fastify.dev/docs/latest/Reference/LTS/
- https://vite.dev/guide/
- https://vitest.dev/guide/
- https://www.postgresql.org/support/versioning/
- https://www.postgresql.org/docs/18/sql-createextension.html

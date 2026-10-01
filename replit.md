# Study Hive

A responsive study companion for Ugandan secondary students, with NCDC curriculum previews, focus tools, and a safe foundation for moderated peer learning.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/study-hive/` — Study Hive web app.
- `artifacts/api-server/` — shared API server.
- `lib/api-spec/openapi.yaml` — API contract source of truth.
- `lib/db/src/schema/` — shared database schema.

## Architecture decisions

- Treat the first app experience as a browser-local demo, not a real student account or shared school campus.
- Do not collect NIN/TMIS in the client. Identity verification and raw-identifier deletion require a trusted, server-side verification flow.
- Never enable shared student posts, files, or classroom signaling until authentication, school/grade authorization, server-side moderation, and reporting are in place.
- Direct messages remain disabled. Any live classroom must enforce a three-participant minimum on the server, not just in the interface.
- Store curriculum items with source, subject, level, and curriculum-version metadata. Lower-secondary and advanced-secondary standards differ; do not invent official NCDC book mappings.

## Product

Study Hive is intended to combine class-based learning, NCDC practical guides, an AI tutor, focus tools, peer learning, and moderated classrooms for Ugandan students in S1–S6.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- NCDC content must be verified against the official curriculum edition before being labeled as verified or used for progression decisions.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

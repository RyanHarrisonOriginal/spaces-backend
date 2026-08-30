# Spaces backend

Express API + Prisma (Neon/Postgres), with a BullMQ worker for asynchronous discovery jobs. Jobs are stored in a dedicated `bullmq` schema on Neon (PostgreSQL backend), not Redis.

## Layout

```text
src/                     Express HTTP API (enqueue only for gather/discovery)
apps/worker/             Runs gather: discovery profile, then gather queries
packages/types/          Shared job types
packages/db/             Prisma client helpers (app data)
packages/queue/          BullMQ queue, Postgres connection, schema migrations
packages/discovery/      Profile generation (port/adapter, OpenAI, persistence)
packages/persistence/    Repos used by both API and worker (gather queries)
prisma/                  Prisma schema (Neon/Postgres application tables)
```

The API does not call OpenAI. `POST /collections/:id/gather` enqueues a `gather_collection` job. The worker generates a discovery profile and writes `searchQueries` as gather queries.

Prisma uses `DATABASE_URL` (Neon pooler is fine). BullMQ uses `NEON_DIRECT_DATABASE_URL` (direct session connection) because workers rely on `LISTEN`/`NOTIFY`.

## Setup

```bash
npm install
cp .env.example .env
# DATABASE_URL: Neon pooled URL for Prisma
# NEON_DIRECT_DATABASE_URL: Neon direct URL (no -pooler) for BullMQ
npm run db:deploy
```

`db:deploy` runs `prisma db push`, then BullMQ's `runMigrations()` into the `bullmq` schema, then seeds. Do not create BullMQ tables by hand.

To migrate the queue schema on its own:

```bash
npm run bullmq:migrate
```

## Run locally

API and worker are independent processes. Use two terminals, or one combined command:

```bash
npm run dev:api      # Express API with reload (http://localhost:3000/api)
npm run dev:worker   # BullMQ discovery worker
```

```bash
npm run dev          # API + worker together
```

Production-style starts:

```bash
npm run build
npm run start:prod    # API from dist/src/main.js
npm run start:worker  # worker via tsx
```

The worker loads `.env` from the repo root. Collection discovery profile generation uses `OPENAI_API_KEY` and `OPENAI_DISCOVERY_MODEL`.

## Gather a collection

```http
POST /api/collections/:collectionId/gather
x-user-id: <user uuid>
```

`202 Accepted` with `{ "jobId": "..." }`. The worker runs discovery profile generation, then persists `searchQueries` as gather queries.

Profile-only generation (no gather queries) remains:

```http
POST /api/collections/:collectionId/discovery-profile
x-user-id: <user uuid>
```

## Queue

Jobs run on BullMQ (`spaces` queue) using the official PostgreSQL backend. Schema objects live in Neon schema `bullmq` and are created/upgraded only by `runMigrations()`. The API enqueues `gather_collection` or `generate_collection_discovery_profile` from `packages/queue`. Failed jobs retry up to 3 times with exponential backoff; unknown job types and missing collections are not retried.

## Database

This repo uses `prisma db push` (not Prisma Migrate) for application tables. After pulling schema changes:

```bash
npm run prisma:push
npm run bullmq:migrate
```

Collection discovery profiles are stored in `collection_discovery_profiles`. Regenerating a profile inserts a new version and marks the previous active row `superseded`.

## Conventions

Persistence, service orchestration, and mapper rules live in [AGENTS.md](./AGENTS.md). Follow that file when adding repositories or application services.

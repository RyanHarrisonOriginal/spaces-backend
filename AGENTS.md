# Spaces backend conventions

Follow these when adding or changing persistence, application services, and discovery.

## Persistence

Repositories expose a small public interface:

```ts
get(...)
save(...)
```

Do not put use-case names on the repository (`persistNewActiveVersion`, `supersedeActiveProfiles`, `getLatestVersion`). Keep those as **private methods** inside the repository implementation.

`save()` may run a short transaction and call private helpers (lock, supersede, insert). The caller still only sees `get` / `save`.

### Repository Save Strategies

When a repository supports multiple use cases that require meaningfully different save behavior, implement those behaviors using the **Strategy pattern** rather than branching within a single save method.

Each save strategy should encapsulate the rules and persistence behavior for one use case while the repository remains responsible for coordinating persistence.

Reference: `packages/discovery/src/infrastructure/persistence/prisma-collection-discovery-profile.repository.ts`

## Application services

The service orchestrates. It loads state, shapes the next record, then persists:

```text
get current record
  → mapper (shape the change)
  → save
```

Do not hide orchestration inside a specialized repository method. Do not put raw SQL or Prisma calls in the service.

Reference: `packages/discovery/src/application/services/collection-discovery-profile.service.ts`

## Mappers

Use a **class mapper** to shape changes. Do not scatter mapping in the service or as ad-hoc `toRecord` helpers on the repository.

- Domain mapper: current record + new data → next domain record (version, status, ids).
- Prisma mapper: database row ↔ domain record (`toDomain` / `toCreateData`).

Reference:

- `packages/discovery/src/domain/collection-discovery-profile.mapper.ts`
- `packages/discovery/src/infrastructure/persistence/prisma-collection-discovery-profile.mapper.ts`

## Discovery / LLM

- Generation runs in **`apps/worker`**. The API only enqueues jobs.
- Jobs use BullMQ's PostgreSQL backend (`packages/queue`) on a dedicated `bullmq` schema. Schema changes go through `runMigrations()`, never Prisma or hand-written SQL.
- Application code depends on the `LlmProvider` port, never the OpenAI SDK.
- Application code depends on the `LlmProvider` port, never the OpenAI SDK.
- The OpenAI SDK lives only in `packages/discovery/src/infrastructure/llm/openai/`.
- Prompts live in dedicated text files under `packages/discovery/src/application/prompts/`. Do not bury prompt bodies in TypeScript.
- Validate LLM JSON with Zod before `save()`.

## HTTP routes

Keep HTTP method, path, and status codes in `*.routes.ts`. Sibling `*.router.ts` files mount those routes onto Express and call command/query handlers. Do not declare method/path/status inline in the router.

Reference: `src/modules/collections/presentation/collections.routes.ts`

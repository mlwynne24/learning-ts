# Project 2: REST API

_Week 6 capstone — combines Weeks 5 (generics + utility types) and 6 (testing) on top of everything from Phase 1._

Build `sensor-api`, a typed HTTP service that ingests, stores, queries, and
aggregates sensor readings. Same domain as Project 1 — different shape: instead
of a one-shot CLI, you're now exposing the data over a long-running server with
typed routes, middleware, validation, and a real test suite.

**Python equivalent:** a FastAPI service backed by an in-memory dict, with
Pydantic request/response models, dependency-injected services, and pytest +
httpx for the integration tests.

---

## The scenario

You shipped `datapipe` in Week 4 — operators ran it on a folder of CSV/JSON
dumps. It worked, but it doesn't scale: every device team is hand-emailing
files. The platform team wants a service that:

- Accepts new readings over HTTP (single or batched)
- Lets clients query historical readings by device, metric, or time window
- Returns per-device statistics (count, min/avg/max value, last seen)
- Has a proper health probe so it can run behind a load balancer
- Is fully tested — no shipping endpoints without integration coverage

The data model is the same `SensorReading` you already validated in Project 1,
so the schemas carry over. The new shape is the server, the routing, and the
test layout.

---

## Acceptance criteria

### 1. Server framework

Use **Fastify 5** (with `fastify-type-provider-zod` for schema-driven typed
routes). Express works too, but Fastify is closer to the FastAPI experience
you already know:

| FastAPI                          | Fastify + zod type provider                   |
| -------------------------------- | --------------------------------------------- |
| `@app.post("/x", response_model=Out)` | `app.post("/x", { schema: { body, response } }, handler)` |
| Pydantic `BaseModel` for I/O     | Zod schemas for body/params/query/response   |
| Auto-generated OpenAPI docs      | `@fastify/swagger` (stretch goal)             |
| `Depends(get_repo)`              | Constructor-injected `Repository` interface  |
| `pytest` + `httpx.AsyncClient`   | Vitest + `app.inject({...})` (in-process)    |

Install (run from repo root):

```bash
npm install fastify @fastify/sensible fastify-type-provider-zod
npm install -D pino-pretty
```

(`zod` is already in `dependencies` from Project 1.)

### 2. Endpoints

| Method | Path                              | Auth     | Purpose                                  |
| ------ | --------------------------------- | -------- | ---------------------------------------- |
| GET    | `/healthz`                        | public   | Liveness — always 200 if process is up   |
| GET    | `/readyz`                         | public   | Readiness — 200 once repo is initialised |
| POST   | `/readings`                       | API key  | Insert one reading. Returns the stored row with server-assigned `id` |
| POST   | `/readings/batch`                 | API key  | Insert many. Partial-failure semantics — see §5 |
| GET    | `/readings`                       | public   | List with filters + pagination — see §4  |
| GET    | `/readings/:id`                   | public   | Fetch one. 404 if missing                |
| DELETE | `/readings/:id`                   | API key  | Remove one. 204 on success, 404 if missing |
| GET    | `/devices/:deviceId/stats`        | public   | Aggregate stats for one device — see §6  |

All bodies and responses are JSON. All `4xx`/`5xx` responses share the error
shape from `@fastify/sensible`:

```json
{ "statusCode": 404, "error": "Not Found", "message": "reading not found: r_42" }
```

### 3. Validation with Zod (schema-first)

Reuse and extend the schema from Project 1. Define request/response schemas
**once**, hand them to Fastify, and read the inferred types off `request` for
free:

```ts
import { z } from "zod";

export const SensorReading = z.object({
  deviceId: z.string().min(1),
  timestamp: z.iso.datetime(),
  metric: z.enum(["temperature", "humidity", "pressure"]),
  value: z.coerce.number().min(-100).max(1000),
});

export const StoredReading = SensorReading.extend({
  id: z.string(),                 // server-assigned, e.g. crypto.randomUUID()
  receivedAt: z.iso.datetime(),   // server-assigned
});

export type SensorReading = z.infer<typeof SensorReading>;
export type StoredReading = z.infer<typeof StoredReading>;
```

In a handler:

```ts
app.post("/readings", { schema: { body: SensorReading, response: { 201: StoredReading } } },
  async (request, reply) => {
    // request.body is fully typed as SensorReading — no cast, no parse call
    const stored = await repo.insert(request.body);
    return reply.code(201).send(stored);
  },
);
```

Validation failures are caught by Fastify before your handler runs and produce
a 400 with details — same DX as FastAPI/Pydantic.

### 4. List endpoint — filters and pagination

`GET /readings` accepts these query params (validate with Zod, all optional):

| Param      | Type                | Default | Notes                                  |
| ---------- | ------------------- | ------- | -------------------------------------- |
| `deviceId` | string              | —       | Exact match                            |
| `metric`   | `temperature \| humidity \| pressure` | — | Exact match                            |
| `since`    | ISO 8601 datetime   | —       | `timestamp >= since`                   |
| `until`    | ISO 8601 datetime   | —       | `timestamp < until`                    |
| `limit`    | int 1–500           | 50      | Page size                              |
| `offset`   | int ≥ 0             | 0       | Skip the first N matching rows         |

Response shape:

```json
{
  "items": [ { "id": "r_...", "deviceId": "...", ... } ],
  "total": 1284,
  "limit": 50,
  "offset": 0
}
```

`total` is the count BEFORE pagination — clients need it to render "showing
1–50 of 1,284".

### 5. Batch insert — partial failure

`POST /readings/batch` accepts `{ "readings": SensorReading[] }`. The whole
batch is validated up front (so a malformed body is a 400 with no inserts).
For runtime/business failures, use partial-success semantics — every item gets
a slot in the response:

```json
{
  "inserted": [
    { "index": 0, "id": "r_..." },
    { "index": 2, "id": "r_..." }
  ],
  "failed": [
    { "index": 1, "error": "duplicate reading" }
  ]
}
```

Status code is `207` if there's any failure, `201` if every item inserted. (We're
not strict about WebDAV's Multi-Status definition — it's just a useful "partial"
signal.)

### 6. Device stats endpoint

`GET /devices/:deviceId/stats` returns:

```json
{
  "deviceId": "sensor-04",
  "readingCount": 142,
  "metrics": {
    "temperature": { "count": 50, "min": 18.4, "avg": 21.7, "max": 25.1, "lastSeen": "2026-05-09T08:14:02Z" },
    "humidity":    { "count": 50, "min": 40.0, "avg": 55.3, "max": 71.2, "lastSeen": "2026-05-09T08:14:02Z" },
    "pressure":    { "count": 42, "min": 998.1, "avg": 1013.4, "max": 1024.0, "lastSeen": "2026-05-09T08:13:01Z" }
  }
}
```

If the device has zero readings: 404. If a metric has zero readings, omit it
from `metrics` (don't return zeros — they'd skew client charts).

The aggregation function MUST be a **pure function** of `StoredReading[]` →
stats — so it lives in `domain/` and gets unit-tested without any HTTP machinery.
This is the testing-pyramid lesson made concrete.

### 7. Authentication

`POST` and `DELETE` routes require a header:

```
X-Api-Key: <key>
```

Where `<key>` matches `process.env.API_KEY`. Implement this as a **Fastify
hook** (`onRequest`) registered only on the protected routes. Missing or wrong
key → 401. Don't roll JWTs — the point is to exercise middleware, not auth.

In dev: `API_KEY=dev-secret npm run dev`.
In tests: set the env var inside `beforeAll` (or use `vi.stubEnv` from W6 §3).

### 8. Configuration and entrypoint

Read config from environment variables — no flag parsing this time:

| Var            | Default     | Purpose                                         |
| -------------- | ----------- | ----------------------------------------------- |
| `PORT`         | `3000`      | Listen port                                     |
| `HOST`         | `127.0.0.1` | Listen interface (`0.0.0.0` to accept external) |
| `API_KEY`      | _required_  | Write-route auth. Refuse to start if unset.    |
| `LOG_LEVEL`    | `info`      | Pino level: `trace`/`debug`/`info`/`warn`/`error` |
| `SEED_FILE`    | _unset_     | Optional path to a `StoredReading[]` JSON file |

`main.ts` builds the server, calls `app.listen()`, and handles SIGINT/SIGTERM
for a graceful shutdown (`await app.close()`). Exit code `1` on listen failure
or missing `API_KEY`.

### 9. Tests — what's required

The Week 6 testing pyramid maps directly:

| Layer                     | Where                              | Tool                                            | What to cover |
| ------------------------- | ---------------------------------- | ----------------------------------------------- | ------------- |
| Unit (pure domain)        | `src/domain/*.test.ts` (co-located) | Vitest                                          | `computeStats`, request/response schemas, error mapping |
| Unit (infra fake)         | `src/infra/in-memory-repo.test.ts` | Vitest                                          | filter/pagination logic in the repo            |
| Integration (HTTP layer)  | `tests/integration/*.test.ts`       | Vitest + `app.inject({ method, url, payload })` | every route, happy + sad paths                  |

Hard requirements:

- Each route has at least one happy path AND one sad path test (404, 401, 400).
- Stats computation is unit-tested with hand-built fixtures, NOT through HTTP.
- `app.inject` is used for HTTP tests — **no real ports, no `fetch`**. It's
  in-process, ~100× faster, and doesn't flake on port collisions.
- Aim for ≥ 80% line coverage on `src/domain/`. `src/main.ts` doesn't need
  coverage (just composition — see W6 §1).
- All tests pass with `npm run test` from the repo root.

---

## Project structure

Follows the layered layout from W6 lesson 04 — domain inside, infra at the
edges, app wires them together:

```
projects/02-rest-api/
├── README.md                      ← this file
├── src/
│   ├── domain/
│   │   ├── reading.ts             ← Zod schemas: SensorReading, StoredReading, query/response
│   │   ├── reading.test.ts
│   │   ├── stats.ts               ← computeStats(readings) — pure function
│   │   ├── stats.test.ts
│   │   └── errors.ts              ← NotFoundError, ConflictError, etc. (domain-level)
│   ├── infra/
│   │   ├── repository.ts          ← Repository<T> interface (generic — see W5)
│   │   ├── in-memory-repo.ts      ← InMemoryReadingRepository implements ReadingRepository
│   │   └── in-memory-repo.test.ts
│   ├── app/
│   │   ├── server.ts              ← buildServer(deps) — returns a configured Fastify instance
│   │   ├── routes/
│   │   │   ├── readings.ts        ← POST, GET (list), GET (one), DELETE, batch
│   │   │   ├── devices.ts         ← stats
│   │   │   └── health.ts          ← /healthz, /readyz
│   │   ├── hooks/
│   │   │   └── auth.ts            ← onRequest hook for X-Api-Key
│   │   └── plugins/
│   │       └── zod.ts             ← register fastify-type-provider-zod
│   └── main.ts                    ← entry: read env, build, listen, graceful shutdown
├── tests/
│   └── integration/
│       ├── readings.test.ts
│       ├── devices.test.ts
│       └── auth.test.ts
└── fixtures/
    └── seed.json                  ← starter data for SEED_FILE / tests
```

The split between `domain/` and `infra/` is the most important architectural
choice in this project. If `domain/stats.ts` ever imports `fastify`, you've
broken the layering. Domain code knows nothing about HTTP.

---

## Skills map

Every module ties back to a lesson you've completed:

| Module                           | Key concepts                                    | Lesson reference                              |
| -------------------------------- | ----------------------------------------------- | --------------------------------------------- |
| `domain/reading.ts`              | Zod, `z.infer`, schema composition (`.extend`)   | Project 1, W5 03 (utility types)              |
| `domain/stats.ts`                | Pure functions, `Map`/`reduce`, generics        | W1 02, W5 01–02                               |
| `domain/errors.ts`               | Custom error classes, `cause`, narrowing         | W3 03 (error handling §6–8)                   |
| `infra/repository.ts`            | Generic interface, dependency inversion         | W5 02 (generic types and classes)             |
| `infra/in-memory-repo.ts`        | Maps, filtering, the "fake" pattern              | W6 02 (mocks vs fakes — §8)                   |
| `app/server.ts`                  | Constructor injection, builder pattern, testability | W6 02 + W6 04 (test-driven design — §7)    |
| `app/routes/*.ts`                | Async handlers, typed request/reply, status codes | W3 02 (async/await), W3 03 (error mapping)    |
| `app/hooks/auth.ts`              | Fastify hooks (`onRequest`), env vars            | W3 03 (custom errors), W2 02 (env)            |
| `app/plugins/zod.ts`             | Type providers, schema-driven typing             | W5 04 (advanced patterns)                     |
| `main.ts`                        | Top-level try/catch, signal handling, exit codes | W3 03 (§9), W4 04 (entry pattern)             |
| `tests/integration/*.test.ts`    | `app.inject`, hermetic tests, env stubbing       | W6 01–04                                      |

---

## New concepts (everything else has been covered)

### Fastify

Compared to Express: typed by design, schema-driven, async-first (handlers can
just `return`/`throw` — no `next()`), hooks instead of middleware-as-function.
Compared to FastAPI: same shape, same opinions, JS instead of Python.

```ts
// Hello-world Fastify with the Zod type provider:
import Fastify from "fastify";
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

const app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.post(
  "/echo",
  { schema: { body: z.object({ msg: z.string() }), response: { 200: z.object({ echoed: z.string() }) } } },
  async (req) => ({ echoed: req.body.msg.toUpperCase() }), // req.body.msg is `string`
);

await app.listen({ port: 3000 });
```

### `app.inject` — in-process HTTP for tests

Don't start a real server in tests. `app.inject` runs the full request
pipeline (hooks, validation, handler, serialisation) without touching a
socket:

```ts
import { describe, it, expect, beforeAll } from "vitest";
import { buildServer } from "../../src/app/server.js";

describe("POST /readings", () => {
  let app: Awaited<ReturnType<typeof buildServer>>;
  beforeAll(async () => { app = await buildServer({ /* deps */ }); });

  it("rejects requests without an api key", async () => {
    const res = await app.inject({ method: "POST", url: "/readings", payload: { /* ... */ } });
    expect(res.statusCode).toBe(401);
  });
});
```

### Repository pattern

The interface lives in `infra/repository.ts`. The in-memory implementation
satisfies it. Routes accept the interface, not the implementation. This is the
"design for testability" lesson from W6 §7 — production wires up the in-memory
one (or a real DB, in a stretch goal); tests pass a fresh fake per test.

```ts
export interface ReadingRepository {
  insert(reading: SensorReading): Promise<StoredReading>;
  findById(id: string): Promise<StoredReading | undefined>;
  list(filter: ReadingFilter): Promise<{ items: StoredReading[]; total: number }>;
  delete(id: string): Promise<boolean>;
}
```

---

## Suggested build order

Build the smallest end-to-end slice first, then widen. Don't write all the
schemas before any routes work.

1. **Skeleton.** `main.ts` + `server.ts` with one `/healthz` route returning
   `{ status: "ok" }`. Run it: `npx tsx projects/02-rest-api/src/main.ts`.
   Curl it. Get one round-trip working before anything else.
2. **Zod plugin.** Register `fastify-type-provider-zod`. Add a throwaway
   `POST /echo` to confirm the validator compiler works end-to-end.
3. **Domain types.** `domain/reading.ts` — copy `SensorReading` from Project 1,
   add `StoredReading`. Write the unit tests for the schemas (parse/safeParse).
4. **Repository interface and fake.** `infra/repository.ts`,
   `infra/in-memory-repo.ts`. Test the fake first — every method, both
   success and miss cases. (W6 §8 "fakes are excellent" applied in anger.)
5. **First real slice.** `POST /readings` + `GET /readings/:id`. Wire the
   repo into the server via `buildServer({ repo })`. Add an integration test
   per route using `app.inject`.
6. **List + filters.** Implement `GET /readings` with the query-param schema.
   Test pagination boundaries (offset past end, limit at min/max).
7. **Errors.** `domain/errors.ts` + a Fastify error handler that maps
   `NotFoundError → 404`, `ValidationError → 400`, anything else → 500. Make
   sure unhandled throws in handlers turn into clean JSON, not stack traces.
8. **Auth hook.** `app/hooks/auth.ts`. Apply it to write routes only. Two
   integration tests: missing key → 401, correct key → 200.
9. **Stats.** Pure function in `domain/stats.ts`, then route in
   `app/routes/devices.ts`. Unit-test the function with hand-built arrays;
   integration-test the route with seeded data.
10. **Batch insert.** Last because it's the fiddliest contract.
11. **Polish.** `/readyz`, graceful shutdown, env validation on boot, README
    of the project's own quirks if any.

---

## Recommended root config additions

These aren't strictly required, but they make the workflow nicer. Add to the
repo-root `package.json` `scripts`:

```json
"dev:api":     "tsx watch projects/02-rest-api/src/main.ts",
"start:api":   "tsx projects/02-rest-api/src/main.ts",
"test:api":    "vitest run projects/02-rest-api"
```

And — if you haven't done it as exercise 1 from W6 lesson 04 — create
`vitest.config.ts` at the repo root with `restoreMocks: true` and
`unstubEnvs: true`. The integration tests will be much more reliable for it.

---

## Stretch goals (optional, in rough order of value)

- **OpenAPI docs.** `npm install @fastify/swagger @fastify/swagger-ui` — the
  Zod type provider feeds schemas straight in. You get an interactive `/docs`
  page for free, just like FastAPI.
- **SQLite persistence.** Add `infra/sqlite-repo.ts` using `better-sqlite3`,
  satisfying the same `ReadingRepository` interface. Pick the implementation
  in `main.ts` based on env (`STORAGE=memory|sqlite`). Repository pattern
  pays for itself the moment you do this.
- **Rate limiting.** `@fastify/rate-limit` on POST routes. One line of config,
  one new integration test for the 429.
- **Server-Sent Events.** Add `GET /readings/stream` that pushes new readings
  as they arrive. This is the bridge to the Week 7-8 message-processor project.
- **Graceful drain.** On SIGTERM, stop accepting new requests but let in-flight
  ones finish before exit. Fastify's `app.close()` does most of this.
- **Cursor pagination.** Replace offset/limit with a `cursor` token for
  `GET /readings`. More work, but no skipped/duplicated rows when data
  changes between pages.
- **GitHub Actions CI.** Drop in the workflow from W6 lesson 04 §6. Fail the
  build on lint, typecheck, format, or test failures. (Bonus: matrix Node
  20 + 22.)
- **Dockerfile.** Multi-stage build: `tsc` in builder, `node` in runtime.
  Sets up the Week 9–10 orchestrator project nicely.

---

## How to get help

1. Check the skills map above — every module references a lesson you've
   already worked through.
2. Fastify docs: <https://fastify.dev> — the "Getting Started" and
   "Validation and Serialization" pages cover ~80% of what you need.
3. `fastify-type-provider-zod` README: <https://github.com/turkerdev/fastify-type-provider-zod>
4. When stuck, ask Claude — describe what you tried, paste the failing test
   output, and what you expected to happen.

When you finish: open a PR (or just push to `main` if you're working solo) and
request a review with `/review`. After the merge, Project 3 unlocks — a
real-time message processor that consumes from this API.

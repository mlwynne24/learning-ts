# Project 1: Data Pipeline CLI

_Week 4 capstone — combines everything from Weeks 1–4_

Build `datapipe`, a command-line tool that reads a CSV or JSON dataset, validates
every row against a schema, enriches valid rows with a simulated API call, and
outputs a summary report.

**Python equivalent:** an argparse + pandas + pydantic script that validates and
transforms a dataset, then prints a summary.

---

## The scenario

You have messy sensor data coming in as CSV or JSON files. Each row should
contain a reading from an IoT device: a device ID, a timestamp, a metric name,
and a numeric value. Some rows are garbage — missing fields, wrong types, values
out of range. Your tool validates, enriches (looks up device metadata via a fake
async API), and reports what passed and what failed.

---

## Acceptance criteria

### 1. CLI interface

```bash
npx tsx projects/01-cli-tool/src/main.ts <file> [options]
```

| Flag              | Default | Description                                       |
| ----------------- | ------- | ------------------------------------------------- |
| `--format`        | auto    | Force input format: `csv` or `json` (auto-detect from extension) |
| `--concurrency`   | 3       | Max parallel enrichment calls                     |
| `--timeout`       | 2000    | Per-row enrichment timeout in ms                  |
| `--output`        | stdout  | Write report to a file instead of stdout          |
| `--verbose`       | false   | Print each row result as it's processed           |

Use a simple argument parser — either hand-roll one with `process.argv` or use
the built-in `node:util` `parseArgs` (Node 18.3+). No need for a third-party
library.

### 2. Input parsing

- Support both **CSV** and **JSON** input files.
- CSV: first row is headers. Use a simple split-on-comma parser (no need to
  handle quoted fields for this project).
- JSON: expect an array of objects at the top level.
- Read files using `node:fs/promises`.

### 3. Validation with Zod

Each row must match this schema:

```ts
import { z } from "zod";

const SensorReading = z.object({
  deviceId: z.string().min(1),
  timestamp: z.string().datetime(),       // ISO 8601
  metric: z.enum(["temperature", "humidity", "pressure"]),
  value: z.number().min(-100).max(1000),
});

type SensorReading = z.infer<typeof SensorReading>;
```

- Invalid rows are collected (not thrown) — the tool keeps going.
- Each validation failure records: row number, the raw data, and the Zod error.

### 4. Enrichment (simulated async API)

For each **valid** row, call a fake async function that "looks up" device
metadata:

```ts
async function enrichReading(
  reading: SensorReading,
  signal?: AbortSignal,
): Promise<EnrichedReading> {
  // Simulate network latency (50–300ms random)
  // ~10% chance of failure (throw an error)
  // Returns: { ...reading, deviceName: string, location: string }
}
```

- Run enrichments with a **concurrency pool** (respect `--concurrency`).
- Each enrichment must respect the `--timeout` flag (use `AbortController`).
- Use `Promise.allSettled` so one failure doesn't kill the batch.

### 5. Report output

Print a summary to stdout (or `--output` file):

```
=== Data Pipeline Report ===
Input:       sensors.csv (24 rows)
Valid:       20
Invalid:     4
Enriched:    18
Enrich failed: 2

--- Validation errors ---
Row 3: metric — Invalid enum value. Expected 'temperature' | 'humidity' | 'pressure', received 'ph'
Row 7: value — Number must be less than or equal to 1000
Row 12: deviceId — String must contain at least 1 character(s)
Row 19: timestamp — Invalid datetime

--- Enrichment failures ---
Row 5: Timed out after 2000ms
Row 14: Device service unavailable
```

- Exit code `0` if all valid rows were enriched successfully.
- Exit code `1` if there were any validation or enrichment failures.

---

## Project structure

```
projects/01-cli-tool/
├── README.md              ← this file
├── src/
│   ├── main.ts            ← entry point: parse args, orchestrate, exit code
│   ├── parse.ts           ← readFile + CSV/JSON parsing
│   ├── validate.ts        ← Zod schema + validation logic
│   ├── enrich.ts          ← fake API + concurrency pool + timeout
│   ├── report.ts          ← format and output the report
│   └── types.ts           ← shared types (SensorReading, EnrichedReading, etc.)
├── fixtures/
│   ├── valid.json         ← all rows pass (happy path)
│   ├── mixed.csv          ← some good, some bad rows
│   └── bad.json           ← all rows fail validation
└── tests/
    ├── parse.test.ts
    ├── validate.test.ts
    ├── enrich.test.ts
    └── report.test.ts
```

---

## Skills map

Every module maps back to a lesson you've completed:

| Module        | Key concepts                                     | Lesson reference                    |
| ------------- | ------------------------------------------------ | ----------------------------------- |
| `main.ts`     | `process.argv`, try/catch at top level, exit codes | W3 03-error-handling (§9), W4 04   |
| `parse.ts`    | `fs/promises`, async file I/O, string splitting  | W3 01-es-modules, W4 02-async-await |
| `validate.ts` | Zod schemas, discriminated unions, Result pattern | W1 04-unions-narrowing, W3 03-errors (§7) |
| `enrich.ts`   | Concurrency pool, AbortController, allSettled     | W4 04-real-world-async (§5–7)       |
| `report.ts`   | Template literals, string formatting, file write  | W1 01-variables, W3 01-es-modules   |
| `types.ts`    | Interfaces, type aliases, Zod infer              | W1 03-objects-interfaces             |

---

## New concept: Zod

Zod is the one new dependency. Think of it as **pydantic for TypeScript** — it
validates data at runtime and infers static types from the schema.

```bash
npm install zod
```

Quick comparison:

```python
# Python / pydantic
class SensorReading(BaseModel):
    device_id: str
    value: float = Field(ge=-100, le=1000)
```

```ts
// TypeScript / Zod
const SensorReading = z.object({
  deviceId: z.string().min(1),
  value: z.number().min(-100).max(1000),
});
type SensorReading = z.infer<typeof SensorReading>;
```

The key difference: in Python, the class IS the type. In TypeScript, the Zod
schema is a runtime validator and `z.infer` extracts the static type from it.
You'll use `schema.safeParse(data)` which returns `{ success: true, data }` or
`{ success: false, error }` — the same Result pattern from lesson 03.

---

## Suggested build order

1. **`types.ts`** — Define your types and Zod schema first. Get the shape right.
2. **`validate.ts`** — Wire up `safeParse`, return structured results.
3. **`parse.ts`** — Read a file, detect format, parse into raw objects.
4. **`enrich.ts`** — Write the fake API, then the pool + timeout wrapper.
5. **`report.ts`** — Format the output.
6. **`main.ts`** — Glue it all together: args → parse → validate → enrich → report → exit.
7. **Fixtures** — Create test data files.
8. **Tests** — Write Vitest tests for each module.

---

## Stretch goals (optional)

- Add a `--json-report` flag that outputs the report as structured JSON.
- Add a progress bar using `\r` overwriting (no external deps).
- Support reading from stdin (`cat data.csv | npx tsx src/main.ts -`).
- Add retry logic to the enrichment step (with jitter, from lesson 04 §6).

---

## How to get help

Work through it yourself first. When you're stuck:

1. Re-read the relevant lesson section (the skills map above points you there).
2. Check the Zod docs: https://zod.dev
3. Ask Claude — describe what you tried and what went wrong.

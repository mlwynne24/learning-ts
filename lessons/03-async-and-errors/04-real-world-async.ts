// Lesson 04: Real-world async patterns
// Run with: npx tsx lessons/03-async-and-errors/04-real-world-async.ts

// This lesson is the toolbox you'll actually reach for when building things.
// Everything here is plain stdlib — no extra packages.

import { setTimeout as delay } from "node:timers/promises";

// ^ Node ships an awaitable setTimeout in `node:timers/promises`. We aliased it
// to `delay` because that name is more natural. No more `new Promise(...)` boilerplate.

// =============================================================================
// 1. Promise.all — WAIT FOR EVERYTHING (fails fast)
// =============================================================================

// Python: asyncio.gather(*tasks)
// TS:     Promise.all([p1, p2, p3])
//
// Returns a Promise that resolves to an ARRAY of results when ALL inputs resolve.
// If ANY input rejects, the whole thing rejects immediately with that error.
// Other inputs keep running but their results are discarded.

async function fetchPort(port: number): Promise<string> {
  await delay(100);
  return `port ${port} ok`;
}

const results = await Promise.all([fetchPort(80), fetchPort(443), fetchPort(8080)]);
console.log("Promise.all:", results);

// TS infers the result type as a TUPLE matching the input order.
// Mixed types work too:
async function fetchUser() {
  return { id: "u1", name: "Morgan" };
}
async function fetchPostCount() {
  return 42;
}

const [user, postCount] = await Promise.all([fetchUser(), fetchPostCount()]);
console.log(`\n${user.name} has ${postCount} posts`);
// `user` is typed as { id, name }, `postCount` as number — no casts needed.

// =============================================================================
// 2. Promise.allSettled — WAIT FOR EVERYTHING (never fails)
// =============================================================================

// Python: asyncio.gather(..., return_exceptions=True)
// TS:     Promise.allSettled([...])
//
// Like Promise.all, but waits for EVERY input regardless of failure.
// Each result is an object: { status: "fulfilled", value } or { status: "rejected", reason }.
// Useful when you want partial results — e.g., "fetch all, show what worked."

async function maybeFail(label: string): Promise<string> {
  await delay(50);
  if (label === "B") throw new Error(`${label} broke`);
  return `${label} ok`;
}

const settled = await Promise.allSettled([maybeFail("A"), maybeFail("B"), maybeFail("C")]);

for (const r of settled) {
  if (r.status === "fulfilled") {
    console.log(`\n  ✓ ${r.value}`);
  } else {
    console.log(`  ✗ ${(r.reason as Error).message}`);
  }
}

// allSettled is the right choice for batch jobs, dashboards, or any UX where
// "one failure shouldn't kill the whole batch" is the desired behaviour.

// =============================================================================
// 3. Promise.race — FIRST TO FINISH (resolve OR reject)
// =============================================================================

// Resolves or rejects as soon as ANY input does. The rest are ignored
// (but not cancelled — Promises don't cancel by default; see AbortController below).

async function slow(): Promise<string> {
  await delay(500);
  return "slow";
}

async function fast(): Promise<string> {
  await delay(100);
  return "fast";
}

const winner = await Promise.race([slow(), fast()]);
console.log(`\nrace winner: ${winner}`);

// Classic use: a timeout wrapper.

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = delay(ms).then(() => {
    throw new Error(`Timed out after ${ms}ms`);
  });
  return Promise.race([promise, timeout]);
}

try {
  await withTimeout(slow(), 200); // slow() takes 500ms, will time out
} catch (err) {
  if (err instanceof Error) console.log(`\ntimeout: ${err.message}`);
}

const onTime = await withTimeout(fast(), 200);
console.log(`onTime: ${onTime}`);

// =============================================================================
// 4. Promise.any — FIRST TO SUCCEED
// =============================================================================

// Like race, but ignores rejections. Resolves with the first FULFILLED value.
// If ALL inputs reject, throws an AggregateError containing every reason.
//
// Use case: "try several mirrors, return whichever works first."

async function mirror(name: string, ms: number, fail = false): Promise<string> {
  await delay(ms);
  if (fail) throw new Error(`${name} unreachable`);
  return `from ${name}`;
}

try {
  const fastest = await Promise.any([
    mirror("us-east", 200, true),
    mirror("eu-west", 100, false),
    mirror("ap-south", 300, false),
  ]);
  console.log(`\nFastest mirror: ${fastest}`);
} catch (err) {
  if (err instanceof AggregateError) {
    console.log(`All mirrors failed: ${err.errors.length} errors`);
  }
}

// =============================================================================
// 5. AbortController — CANCELLING WORK
// =============================================================================

// Python: asyncio.Task.cancel()
// TS:     AbortController + AbortSignal
//
// Promises themselves can't be cancelled — once started, they run to completion.
// AbortController is the standard way to signal "give up" to APIs that support it.
// fetch, setTimeout (in node:timers/promises), and many libraries respect it.

const ac = new AbortController();

// Schedule cancellation after 50ms.
setTimeout(() => ac.abort(new Error("user cancelled")), 50);

try {
  // Pass the signal to any abortable operation. Here, our delay supports it.
  await delay(500, undefined, { signal: ac.signal });
  console.log("\ndelay finished (unexpected)");
} catch (err) {
  if (err instanceof Error) console.log(`\ndelay cancelled: ${err.name}`);
}

// Pattern for your own functions: take an optional `AbortSignal` parameter,
// throw if it's already aborted, and listen for the "abort" event.

async function cancellableWork(signal?: AbortSignal): Promise<string> {
  if (signal?.aborted) throw new Error("Already aborted");
  await delay(100, undefined, { signal });
  return "work done";
}

const ac2 = new AbortController();
const result = await cancellableWork(ac2.signal); // not aborted
console.log(`cancellableWork: ${result}`);

// =============================================================================
// 6. RETRIES WITH BACKOFF
// =============================================================================

// Common pattern: retry a flaky operation with increasing delay between attempts.
// You build this yourself — it's only ~15 lines and the libraries that wrap it
// (p-retry, async-retry) don't add much.

async function retry<T>(operation: () => Promise<T>, attempts = 3, baseDelayMs = 100): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;
      if (i < attempts - 1) {
        const wait = baseDelayMs * 2 ** i; // 100ms, 200ms, 400ms...
        console.log(`  attempt ${i + 1} failed, retrying in ${wait}ms`);
        await delay(wait);
      }
    }
  }
  throw new Error("retry: all attempts failed", { cause: lastError });
}

// Demo: succeeds on the 3rd try.
let calls = 0;
async function flaky() {
  calls++;
  if (calls < 3) throw new Error(`call ${calls} failed`);
  return `success on call ${calls}`;
}

console.log("\n=== retry ===");
const retryResult = await retry(flaky, 5);
console.log(retryResult);

// =============================================================================
// 7. CONCURRENCY LIMITS (semaphore-ish)
// =============================================================================

// Promise.all runs everything at once. Sometimes that's too much — APIs rate
// limit you, or you want to avoid hammering a database.
//
// You can write a simple "pool" that runs at most N tasks concurrently.

async function pool<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array<R>(items.length);
  let cursor = 0;

  async function run() {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await worker(items[i]!);
    }
  }

  // Spin up `limit` workers; each pulls from the shared cursor.
  const workers = Array.from({ length: Math.min(limit, items.length) }, run);
  await Promise.all(workers);
  return results;
}

console.log("\n=== concurrency pool (limit 2) ===");
const start = Date.now();
const items = [1, 2, 3, 4, 5, 6];
const poolResults = await pool(items, 2, async (n) => {
  await delay(100);
  return n * n;
});
console.log(`results: ${poolResults} in ${Date.now() - start}ms`);
// 6 items × 100ms / 2 concurrent ≈ 300ms. With Promise.all directly: 100ms.

// In real projects: use the `p-limit` package. It's tiny and battle-tested.
// We did this by hand to demystify it.

// =============================================================================
// 8. fetch — THE STANDARD HTTP CLIENT
// =============================================================================

// Node 18+ ships `fetch` globally — the same API as browsers.
// You almost never need axios or got for simple cases anymore.

// Uncomment to try it (requires internet):
//
const response = await fetch("https://api.github.com/repos/microsoft/typescript");
if (!response.ok) {
  // fetch ONLY rejects on network failure — HTTP errors (404, 500) are NOT thrown.
  // You must check response.ok yourself. This is a famous gotcha.
  throw new Error(`HTTP ${response.status}`);
}
const data = (await response.json()) as { stargazers_count: number; name: string };
console.log(`${data.name}: ${data.stargazers_count} stars`);

// Note the cast on `response.json()` — it returns `Promise<any>`, so you should
// validate the shape at runtime (Zod is the standard tool, covered in the CLI project).

// fetch + AbortController + timeout, the production pattern:
//
async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), ms);
  try {
    return await fetch(url, { signal: ac.signal });
  } finally {
    clearTimeout(timer);
  }
}

// =============================================================================
// 9. ASYNC ITERATORS — for await...of
// =============================================================================

// Python: async for x in stream:
// TS:     for await (const x of stream)
//
// You'll meet these when consuming streams (file reads, HTTP responses,
// database cursors, message queues).

async function* countDown(from: number): AsyncGenerator<number> {
  for (let i = from; i > 0; i--) {
    await delay(50);
    yield i;
  }
}

console.log("\n=== async iterator ===");
for await (const n of countDown(3)) {
  console.log(`  ${n}...`);
}
console.log("  liftoff");

// You define an async generator with `async function*`. Each `yield` produces
// a value; the consumer's `for await` pulls them one at a time.
//
// Real example: reading a file line by line without loading the whole file.
//   import { createReadStream } from "node:fs";
//   import { createInterface } from "node:readline";
//   const rl = createInterface({ input: createReadStream("big.txt") });
//   for await (const line of rl) { ... }

// =============================================================================
// 10. PUTTING IT TOGETHER — WHAT THE CLI PROJECT WILL USE
// =============================================================================

// The Week 4 project (projects/01-cli-tool) is going to combine almost
// everything from this week:
//
//   - reading a CSV/JSON file from disk        (async fs API)
//   - parsing it                                (try/catch + custom errors)
//   - validating the rows with Zod              (a bit like pydantic — runtime types)
//   - processing rows in parallel with a limit  (the pool pattern from section 7)
//   - timing out slow rows                      (Promise.race or AbortController)
//   - reporting failures without exiting        (Promise.allSettled)
//   - exit code 1 on error, 0 on success        (process.exit + try/catch in main)
//
// You don't need to internalise this list — when we get to the project, every
// piece will map back to a section in this lesson.

// =============================================================================
// EXERCISES: Try these in your editor
// =============================================================================
// 1. Write `fetchAllInParallel(urls: string[]): Promise<string[]>` that uses
//    a fake fetch (just returns `delay(100).then(() => url.toUpperCase())`).
//    First do it with Promise.all, then with the `pool` function from section 7.
//    Compare the timings for 10 URLs with limit 3.
const fakeFetch = async (url: string) => delay(100).then(() => url.toUpperCase());

async function fetchAllInParallel(urls: string[]): Promise<string[]> {
  return await Promise.all(urls.map(fakeFetch));
}

const urls: string[] = [
  "1.com",
  "2.com",
  "3.com",
  "4.com",
  "5.com",
  "6.com",
  "7.com",
  "8.com",
  "9.com",
  "10.com",
];

const runParallel = async (start: number) => {
  const results = await fetchAllInParallel(urls);
  console.log(`Time taken for parallel: ${Date.now() - start}`);
  return results;
};

const runPool = async (start: number, limit: number) => {
  const results = await pool(urls, limit, fakeFetch);
  console.log(`Time taken for pool: ${Date.now() - start}`);
  return results;
};

const start1 = Date.now();
const resultsParallel = await fetchAllInParallel(urls);
console.log(`Parallel: ${Date.now() - start1}ms`);

const start2 = Date.now();
const resultsPool = await pool(urls, 3, fakeFetch);
console.log(`Pool (limit 3): ${Date.now() - start2}ms`);
//
// 2. Write `sleepThenSay(ms: number, msg: string)` that uses delay and logs.
//    Then race two of them with different ms — verify the faster one wins.
async function sleepThenSay(ms: number, msg: string): Promise<void> {
  await delay(ms);
  console.log(msg);
}

const fastSpeaker = async () => sleepThenSay(20, "I am the fast speaker");
const slowSpeaker = async () => sleepThenSay(50, "I am the slow speaker");

await Promise.race([fastSpeaker(), slowSpeaker()]);
//
// 3. Implement `withTimeout` (section 3) using AbortController instead of
//    Promise.race. Hint: schedule ac.abort(...) in a setTimeout, pass the
//    signal into a delay-based simulation, and handle the AbortError.
// function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
//   const timeout = delay(ms).then(() => {
//     throw new Error(`Timed out after ${ms}ms`);
//   });
//   return Promise.race([promise, timeout]);
// }

// try {
//   await withTimeout(slow(), 200); // slow() takes 500ms, will time out
// } catch (err) {
//   if (err instanceof Error) console.log(`\ntimeout: ${err.message}`);
// }

// const onTime = await withTimeout(fast(), 200);
// console.log(`onTime: ${onTime}`);
async function withTimeout2<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  ms: number,
): Promise<T> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(new Error(`Timed out after ${ms}ms`)), ms);
  try {
    return await operation(ac.signal);
  } finally {
    clearTimeout(timer); // clean up if operation finishes before timeout
  }
}

const delaySimulation = async (signal: AbortSignal): Promise<string> => {
  await delay(500, undefined, { signal });
  return "Promise resolved";
};

try {
  await withTimeout2(delaySimulation, 200);
} catch (err) {
  if (err instanceof Error) console.log(`\nsimulation cancelled: ${err.message}`);
}
//
// 4. Write `retryWithJitter` — like the retry function in section 6 but add
//    a random 0–50ms jitter to each backoff delay (helps avoid thundering herds).
//
// 5. (Bonus) Write an async generator `paginated<T>(fetchPage: (page: number)
//    => Promise<T[]>, totalPages: number)` that yields items from each page in
//    order. Consume it with for await and log every item.

console.log("\n--- Lesson 04 complete --- real-world async ---");
console.log("\n🎉 Week 4 complete! Next up: project 01 — CLI tool.");

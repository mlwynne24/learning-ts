// Lesson 03: Testing async code — promises, timers, and determinism
// Run this file:  npx tsx lessons/06-testing/03-async-testing.ts
// Run the tests:  npm run test
//
// Companion test file: 03-async-testing.test.ts

import { setTimeout as delay } from "node:timers/promises";

// =============================================================================
// 1. ASYNC TESTS — THE BASIC RECIPE
// =============================================================================

// Python: pytest-asyncio, @pytest.mark.asyncio
// TS:     no plugin needed — just make your test function async
//
// The test function itself can be async. Vitest awaits the returned Promise.
// If it rejects or throws, the test fails.
//
//   it("resolves to a user", async () => {
//     const user = await fetchUser("u1");
//     expect(user.name).toBe("Morgan");
//   });

// =============================================================================
// 2. THE CODE WE'LL TEST
// =============================================================================

export async function fetchUser(id: string): Promise<{ id: string; name: string }> {
  await delay(50);
  if (id === "missing") throw new Error(`user not found: ${id}`);
  return { id, name: `User ${id}` };
}

export async function retry<T>(
  fn: () => Promise<T>,
  attempts = 3,
  baseDelayMs = 100,
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < attempts - 1) {
        await delay(baseDelayMs * 2 ** i);
      }
    }
  }
  throw new Error("retry: all attempts failed", { cause: lastError });
}

export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  waitMs: number,
): (...args: A) => void {
  let timer: NodeJS.Timeout | undefined;
  return (...args: A) => {
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), waitMs);
  };
}

// Quick sanity run — so you can see the functions work before testing.
const user = await fetchUser("u1");
console.log(`fetched: ${user.name}`);

// =============================================================================
// 3. ASSERTING ON PROMISES — .resolves / .rejects
// =============================================================================

// Two equivalent styles. Use whichever reads better per test.
//
// Style A — await inside the test, assert on the value:
//
//   const user = await fetchUser("u1");
//   expect(user.name).toBe("User u1");
//
// Style B — assert on the Promise itself using .resolves / .rejects:
//
//   await expect(fetchUser("u1")).resolves.toEqual({ id: "u1", name: "User u1" });
//   await expect(fetchUser("missing")).rejects.toThrow("user not found");
//
// The .rejects matcher is especially nice — it handles the "must throw" check
// without the try/catch dance.
//
// Common mistake: forgetting `await` before `expect(...).rejects`. The test
// passes even when the assertion fails, because the rejection happens
// after the test function has already returned. ALWAYS await.

// =============================================================================
// 4. FAKE TIMERS
// =============================================================================

// Python: freezegun, or monkeypatching time
// TS/Vitest: vi.useFakeTimers() — replaces setTimeout, setInterval, Date, etc.
//
// Without fake timers, testing the `retry` function above would take ~700ms
// real time (100 + 200 + 400). With fake timers, it's instant.
//
// Key APIs:
//   vi.useFakeTimers()           — switch to fakes (inside test or beforeEach)
//   vi.useRealTimers()           — switch back (afterEach)
//   vi.advanceTimersByTime(ms)   — move the clock forward, fire due timers
//   await vi.advanceTimersByTimeAsync(ms)  — same, but lets microtasks run
//   vi.runAllTimers()            — run every scheduled timer to completion
//   vi.setSystemTime(date)       — fix Date.now() and new Date()

const timerApis: [string, string][] = [
  ["vi.useFakeTimers()", "install fakes"],
  ["vi.useRealTimers()", "uninstall fakes (cleanup)"],
  ["vi.advanceTimersByTime(ms)", "fast-forward ms and fire anything due"],
  ["vi.advanceTimersByTimeAsync(ms)", "same, awaits microtasks (use for async)"],
  ["vi.runAllTimers()", "drain the queue completely"],
  ["vi.setSystemTime(date)", "pin Date.now/new Date to a value"],
];

console.log("\n=== fake timer APIs ===");
for (const [api, desc] of timerApis) {
  console.log(`  ${api.padEnd(34)} ${desc}`);
}

// GOTCHA: `node:timers/promises` also uses the underlying setTimeout,
// so fake timers affect it too — but only if you've installed fakes BEFORE
// your code calls delay. Install in `beforeEach` or at the top of the test.
//
// GOTCHA 2: when mixing fake timers with async/await, use the *Async variants.
// Plain advanceTimersByTime doesn't drain the microtask queue, so awaited
// code after a timer doesn't run until the next tick. See companion tests.

// =============================================================================
// 5. DETERMINISTIC NON-DETERMINISM
// =============================================================================

// Random and time are the most common sources of flaky tests. Control them.

// Date.now() / new Date():
//   vi.useFakeTimers();
//   vi.setSystemTime(new Date("2026-04-16T12:00:00Z"));
//   expect(Date.now()).toBe(new Date("2026-04-16T12:00:00Z").getTime());

// Math.random():
//   const randSpy = vi.spyOn(Math, "random").mockReturnValue(0.42);
//   // any code that calls Math.random now gets 0.42 back
//   randSpy.mockRestore();

// Environment variables:
//   vi.stubEnv("NODE_ENV", "production");   // automatically unstubbed after test
//   vi.unstubAllEnvs();                      // explicit cleanup if needed

// Global fetch:
//   already covered in lesson 2

// =============================================================================
// 6. TESTING CODE THAT USES SETTIMEOUT (debounce)
// =============================================================================

// debounce is a textbook case — it's trivially wrong without timer control.
// Real-time testing requires actual waits (slow, flaky). Fake timers make it
// instant and deterministic.

// In the test we'll:
//   1. vi.useFakeTimers()
//   2. Create a debounced fn
//   3. Call it several times in quick succession
//   4. Assert the underlying fn hasn't been called yet
//   5. vi.advanceTimersByTime(waitMs)
//   6. Assert the underlying fn was called exactly once

// See 03-async-testing.test.ts for the runnable version.

// =============================================================================
// 7. TESTING CODE THAT USES fetch
// =============================================================================

// Covered in lesson 2 — stub globalThis.fetch with vi.spyOn.
// For more complex scenarios (request matchers, sequencing), the package
// `msw` (Mock Service Worker) is the industry standard. We don't need it yet.

// =============================================================================
// 8. RETRIES, BACKOFF, AND FAKE TIMERS TOGETHER
// =============================================================================

// Our `retry` function uses exponential backoff. Without fakes:
//   - attempts=3, baseDelayMs=100 → ~300ms real wait
//   - Tests get slow fast, and timing drift causes flakes in CI.
//
// With fakes:
//   1. Install fakes
//   2. Mock the operation — first call rejects, second rejects, third resolves
//   3. Kick off the retry: `const promise = retry(opMock, 3, 100)`
//   4. advanceTimersByTimeAsync(100) — unblocks the first delay
//   5. advanceTimersByTimeAsync(200) — unblocks the second
//   6. await promise and assert the value
//
// The async version of advanceTimersByTime is critical here — plain
// advanceTimersByTime doesn't give the awaited fn a chance to run before
// the next line.

// =============================================================================
// 9. ASYNC LEAKAGE BETWEEN TESTS
// =============================================================================

// Unawaited Promises, dangling intervals, or un-restored mocks leak into
// later tests and produce baffling failures. Defences:
//
//   afterEach(() => {
//     vi.useRealTimers();        // ensure timers are restored
//     vi.restoreAllMocks();      // ensure spies are restored
//     vi.unstubAllEnvs();        // ensure env overrides are cleared
//   });
//
// Or just set these in vitest.config (next lesson). The rule: every test
// starts from a clean slate.

// =============================================================================
// 10. EXAMPLE-DRIVEN DEVELOPMENT (TDD LITE)
// =============================================================================

// Async bugs are where TDD pays off the most. The workflow:
//   1. Write a failing test that DESCRIBES the async behaviour you want.
//   2. Run it, watch it fail for the right reason.
//   3. Implement until it passes.
//   4. Refactor.
//
// Async code is notorious for "works on my machine" bugs. A deterministic
// test is the only place you can pin down the ordering you actually want.

// =============================================================================
// EXERCISES
// =============================================================================
// 1. Read 03-async-testing.test.ts and run `npm run test`. Identify which
//    test would have taken seconds in real-time terms without fake timers.
//
// 2. Add a test to the .test.ts file that verifies `retry` gives up after
//    `attempts` failures and throws. Use vi.fn().mockRejectedValue and
//    fake timers so the test is instant.
//
// 3. Write a test for a new function here: `throttle<A>(fn, waitMs)` — like
//    debounce but calls fn IMMEDIATELY on the first call, then ignores further
//    calls until waitMs has passed. Use fake timers to assert the behaviour.
//
// 4. Write a test that asserts `new Date().toISOString()` returns a specific
//    value by combining vi.useFakeTimers + vi.setSystemTime.
//
// 5. (Bonus) Use vi.stubEnv("NODE_ENV", "test") inside a test. Write a small
//    `shouldLogDebug()` function that reads process.env.NODE_ENV, and test it
//    under both "test" and "production". Verify env is cleaned up between tests.

console.log("\n--- Lesson 03 complete --- async testing (run: npm run test)");

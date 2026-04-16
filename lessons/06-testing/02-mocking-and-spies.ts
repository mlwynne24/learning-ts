// Lesson 02: Mocking and spies — controlling dependencies in tests
// Run this file:  npx tsx lessons/06-testing/02-mocking-and-spies.ts
// Run the tests:  npm run test
//
// Companion test file: 02-mocking-and-spies.test.ts

// =============================================================================
// 1. WHY MOCK?
// =============================================================================

// Python: unittest.mock (mock, MagicMock, patch)
// TS:     vi.fn / vi.spyOn / vi.mock (shipped with vitest)
//
// Your code under test usually TALKS to things — HTTP APIs, file systems,
// databases, clocks, random numbers. In tests you want to:
//   - Avoid real side effects (slow, flaky, expensive)
//   - Simulate conditions that are hard to reproduce (5xx errors, timeouts)
//   - Verify the right calls happened with the right arguments
//
// Mocking replaces a real collaborator with a stand-in you control.

// =============================================================================
// 2. THREE TOOLS FOR THREE JOBS
// =============================================================================

const tools: [string, string, string][] = [
  ["vi.fn()", "creates a stub/mock function", "callbacks, injected deps"],
  ["vi.spyOn(obj, 'name')", "wraps an existing method", "observe without replacing"],
  ["vi.mock('module')", "replaces a whole module", "external packages, modules with side effects"],
];

console.log("=== mocking tools ===");
for (const [tool, what, when] of tools) {
  console.log(`  ${tool.padEnd(26)} ${what.padEnd(32)} — ${when}`);
}

// Rule of thumb: reach for the lightest tool that does the job.
// vi.fn < vi.spyOn < vi.mock. Deep module mocks are a code smell if overused —
// they tightly couple tests to implementation.

// =============================================================================
// 3. THE CODE WE'LL TEST
// =============================================================================

// Classic example: a service that depends on a notifier and a clock.
// The production code injects the real implementations; tests inject fakes.

export interface Notifier {
  send(channel: string, message: string): Promise<void>;
}

export interface Clock {
  now(): Date;
}

export class AlertService {
  constructor(
    private readonly notifier: Notifier,
    private readonly clock: Clock,
  ) {}

  async trigger(level: "info" | "error", message: string): Promise<string> {
    const timestamp = this.clock.now().toISOString();
    const formatted = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    await this.notifier.send(level === "error" ? "pager" : "slack", formatted);
    return formatted;
  }
}

// This code is EASY to test because it doesn't construct its dependencies —
// it takes them as arguments. This pattern (dependency injection) is the
// biggest testability lever in OOP. If you can't mock something, usually the
// code's design is the problem, not the test.

// Quick sanity run so you see it work before we mock anything:
const real: AlertService = new AlertService(
  { send: async (c, m) => console.log(`[real notifier] ${c}: ${m}`) },
  { now: () => new Date() },
);
await real.trigger("info", "server started");

// =============================================================================
// 4. vi.fn() — MOCK FUNCTIONS
// =============================================================================

// In a test file, you'd write:
//
//   import { vi } from "vitest";
//   const sendMock = vi.fn();
//   sendMock("slack", "hi");
//   expect(sendMock).toHaveBeenCalledTimes(1);
//   expect(sendMock).toHaveBeenCalledWith("slack", "hi");
//
// A mock function:
//   - Records every call (args, return value, timestamp)
//   - Can be given a return value (mockReturnValue, mockResolvedValue, etc.)
//   - Can throw on demand (mockRejectedValue, mockImplementationOnce)
//
// The most useful matchers:
//
//   expect(fn).toHaveBeenCalled()
//   expect(fn).toHaveBeenCalledTimes(n)
//   expect(fn).toHaveBeenCalledWith(arg1, arg2, ...)
//   expect(fn).toHaveBeenNthCalledWith(n, ...)
//   expect(fn).toHaveReturnedWith(value)
//   expect(fn).not.toHaveBeenCalled()

// =============================================================================
// 5. vi.fn — CANNED RETURNS
// =============================================================================

// You can make a mock return specific values. Common shapes:
//
//   const getUser = vi.fn().mockReturnValue({ id: "u1", name: "Morgan" });
//   const fetchUser = vi.fn().mockResolvedValue({ id: "u1" });      // async
//   const broken = vi.fn().mockRejectedValue(new Error("boom"));    // async error
//
//   // Different result each call:
//   const flaky = vi.fn()
//     .mockReturnValueOnce("first")
//     .mockReturnValueOnce("second")
//     .mockReturnValue("default");
//
//   // Or use an implementation:
//   const counter = vi.fn((x: number) => x * 2);

// Type-safe mocks: cast the generic to the function's type.
// This gives autocomplete and catches signature drift.
//
//   const send: Notifier["send"] = vi.fn();
//   // or:
//   const notifier: Notifier = { send: vi.fn() };

// =============================================================================
// 6. vi.spyOn — WATCH WITHOUT REPLACING
// =============================================================================

// vi.fn REPLACES. vi.spyOn OBSERVES (and can optionally replace).
//
//   const service = new AlertService(realNotifier, realClock);
//   const spy = vi.spyOn(service, "trigger");
//
//   await service.trigger("info", "hi");
//
//   expect(spy).toHaveBeenCalledWith("info", "hi");
//   // The real method STILL ran — spy just recorded the call.
//
// To also replace the behaviour:
//   spy.mockResolvedValue("fake result");
//
// Cleanup is important — spies on globals/singletons bleed across tests.
// Use `spy.mockRestore()` in afterEach, or `vi.restoreAllMocks()`.

// =============================================================================
// 7. vi.mock — MODULE-LEVEL MOCKS
// =============================================================================

// When your code DIRECTLY imports a module — not injected — use vi.mock.
// Typical targets: the `fetch` global, a third-party client, node:fs.
//
//   import { vi, expect, it } from "vitest";
//   import { fetchUser } from "./users.js";
//
//   vi.mock("./api-client.js", () => ({
//     get: vi.fn().mockResolvedValue({ id: "u1", name: "Morgan" }),
//   }));
//
// Vitest "hoists" vi.mock to the top of the file (before imports) — this is
// deliberate: the mock has to be in place before ./users.js loads.
//
// Gotcha: you often need to ALSO import from the mocked module inside the test
// to get a handle on the mock function:
//
//   import * as apiClient from "./api-client.js";
//   ...
//   expect(apiClient.get).toHaveBeenCalled();
//
// We don't have a side-effect-heavy module to mock in this tiny lesson,
// but the companion .test.ts file shows a small example.

// =============================================================================
// 8. FAKES vs MOCKS (terminology)
// =============================================================================

// You'll hear "mock" used loosely to mean any test double. In practice:
//
//   Stub   — returns canned data. "When asked, say X."
//   Mock   — verifies interactions. "Was I called with the right args?"
//   Spy    — records calls on a real implementation. "What happened?"
//   Fake   — a simpler, in-memory implementation of the real thing.
//            e.g., an InMemoryUserRepo that implements UserRepo with a Map.
//
// Fakes are under-used and excellent. Writing a well-designed fake pays off
// across many tests, while a complex mock tends to entangle one test with
// one implementation.

// Example fake — we'll use this in the companion test file.
export class InMemoryNotifier implements Notifier {
  public readonly sent: { channel: string; message: string }[] = [];

  async send(channel: string, message: string): Promise<void> {
    this.sent.push({ channel, message });
  }
}

// Tests can inspect `.sent` directly — often clearer than mock.mock.calls.
const fake = new InMemoryNotifier();
await fake.send("slack", "via fake");
console.log(`\nfake captured: ${JSON.stringify(fake.sent)}`);

// =============================================================================
// 9. RESET vs CLEAR vs RESTORE
// =============================================================================

// Three cleanup operations. They sound similar but differ:

const cleanup: [string, string][] = [
  ["vi.clearAllMocks()", "wipes call history but keeps mock implementation"],
  ["vi.resetAllMocks()", "wipes call history AND removes any mockImplementation"],
  ["vi.restoreAllMocks()", "only for spies — restores the ORIGINAL method"],
];

console.log("\n=== cleanup ===");
for (const [op, desc] of cleanup) {
  console.log(`  ${op.padEnd(28)} ${desc}`);
}

// Sensible default: `afterEach(() => vi.restoreAllMocks())` — keeps tests
// hermetic. You can also set `clearMocks: true` in vitest.config.ts.

// =============================================================================
// 10. WHEN TO REACH FOR A MOCK
// =============================================================================

// Good reasons:
//   - External service (HTTP, DB, queue)
//   - Time, randomness, or any non-determinism
//   - Slow or unreliable real implementation
//   - Verifying a side effect (email was sent, logger was called)
//
// Bad reasons (usually design smells):
//   - Mocking "everything the class uses" — you're re-implementing the class
//   - Mocking pure functions just to avoid calling them
//   - Mocking private methods — if you need to, make them public or test via
//     the public API
//
// If a test has more mock setup than actual logic, simplify. Either the
// collaborator is too chatty (refactor it) or the unit under test is too big.

// =============================================================================
// EXERCISES
// =============================================================================
// 1. Open 02-mocking-and-spies.test.ts. Read the existing tests for AlertService.
//    Add a new test that verifies "info" alerts go to the slack channel and
//    "error" alerts go to the pager channel, using a mock Notifier.
//
// 2. Using vi.spyOn on Math.random, write a test for a function
//    `rollDice(): 1 | 2 | 3 | 4 | 5 | 6` (you can define it here). Verify
//    that when Math.random returns 0, the roll is 1; when it returns 0.99...,
//    the roll is 6. Restore after.
//
// 3. Write a fake `InMemoryClock implements Clock` with a method `advance(ms: number)`
//    that moves the clock forward. Use it to write a test for AlertService that
//    makes the timestamp deterministic.
//
// 4. (Bonus) Extract the `fetch` call in the CLI tool project (projects/01-cli-tool)
//    into an injected `HttpClient` interface. Write a test that uses a mocked
//    HttpClient to verify your code handles a 500 response correctly.
//    This is the "design for testability" lesson applied in anger.

console.log("\n--- Lesson 02 complete --- mocking and spies (run: npm run test)");

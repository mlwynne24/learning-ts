// Lesson 01: Vitest — writing your first tests
// Run this file with:    npx tsx lessons/06-testing/01-vitest-intro.ts
// Run the tests with:    npm run test  (or: npx vitest run lessons/06-testing)
//
// Companion test file:   01-vitest-intro.test.ts
//
// This .ts file explains the concepts and demonstrates the code under test.
// The .test.ts file next to it contains real vitest tests you can run.

// =============================================================================
// 1. WHY VITEST?
// =============================================================================

// Python: pytest — the de facto test runner for Python code
// TS/JS:  several options — Jest (legacy), Mocha, Node's built-in node:test, Vitest
//
// Vitest is the modern default for new TS projects. Reasons:
//   - Runs TypeScript directly (no compile step, same config as Vite)
//   - Same assertion API as Jest — copy/paste works
//   - Fast (parallel by default, hot-reload in --watch)
//   - ESM-native (no CommonJS gymnastics)
//   - Built-in mocking, coverage, snapshots
//
// Our devDependencies already include vitest. You've been running it with
// `npm run test` whether you realised it or not — there just weren't any tests.

// =============================================================================
// 2. FILE LAYOUT AND NAMING
// =============================================================================

// Vitest auto-discovers any file matching:
//   **/*.test.ts
//   **/*.spec.ts
//
// Two common layouts:
//
//   Co-located — test sits next to the code it tests:
//     src/
//       parser.ts
//       parser.test.ts      ← easy to find, moves with the code
//
//   Separate `tests/` folder — mirrors src/:
//     src/parser.ts
//     tests/parser.test.ts
//
// Pick one and stick with it per project. We use co-located in this repo.

// =============================================================================
// 3. THE CODE WE'LL TEST
// =============================================================================

// We'll write tests for these small pure functions. Each one is chosen to
// demonstrate a different kind of assertion. They're exported from this file
// (see the export at the bottom) so the .test.ts file can import them.

export function add(a: number, b: number): number {
  return a + b;
}

export function greet(name: string): string {
  if (!name) throw new Error("name required");
  return `Hello, ${name}!`;
}

export function uniq<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

export interface User {
  id: string;
  name: string;
  age: number;
}

export function isAdult(user: User): boolean {
  return user.age >= 18;
}

// Quick sanity runs — so you can see the functions work before testing them.
console.log(`add(2, 3) = ${add(2, 3)}`);
console.log(`greet("Morgan") = ${greet("Morgan")}`);
console.log(`uniq([1,1,2,3,3]) = ${uniq([1, 1, 2, 3, 3])}`);
console.log(`isAdult(30yo) = ${isAdult({ id: "u1", name: "Morgan", age: 30 })}`);

// =============================================================================
// 4. ANATOMY OF A VITEST TEST
// =============================================================================

// A minimal test file looks like this:
//
//   import { describe, it, expect } from "vitest";
//   import { add } from "./01-vitest-intro.js";
//
//   describe("add", () => {
//     it("sums two positive numbers", () => {
//       expect(add(2, 3)).toBe(5);
//     });
//   });
//
// Key pieces:
//
//   describe(label, fn)  — groups related tests. Optional but highly recommended.
//                          Can nest. Python: roughly a test class.
//   it(label, fn)        — one test. Also aliased as `test`. Label describes
//                          the BEHAVIOUR being verified.
//   expect(value)        — starts an assertion. Chain a matcher to finish it.
//   .toBe(expected)      — one of ~30 built-in matchers.
//
// See 01-vitest-intro.test.ts for the runnable version.

// =============================================================================
// 5. EXPECT MATCHERS — THE CHEAT SHEET
// =============================================================================

// Python's `assert x == y` is a single comparison. Vitest gives you a matcher
// per INTENT. The right matcher produces a better failure message.

const matchers: [string, string][] = [
  ["toBe(x)", "strict equality (===). Use for primitives and refs."],
  ["toEqual(x)", "deep equality. Use for objects and arrays."],
  ["toStrictEqual(x)", "like toEqual but also checks undefined keys and prototypes."],
  ["toBeTruthy() / toBeFalsy()", "truthiness check (JS coercion)."],
  ["toBeNull() / toBeUndefined()", "explicit null/undefined."],
  ["toBeDefined()", "not undefined."],
  ["toContain(x)", "array includes x, or string contains substring."],
  ["toHaveLength(n)", "arr.length === n or str.length === n."],
  ["toMatch(regex)", "string matches the regex."],
  ["toBeGreaterThan(n)", "and toBeLessThan, toBeGreaterThanOrEqual, etc."],
  ["toBeCloseTo(n, digits)", "floating-point comparison (avoids 0.1+0.2 !== 0.3)."],
  ["toThrow(err?)", "the fn passed to expect threw. Optional: err is a message or regex."],
  ["toHaveProperty(key, value?)", "object has that key (optionally with value)."],
  [".not", "negates the next matcher: expect(x).not.toBe(5)"],
];

console.log("\n=== matcher cheatsheet ===");
for (const [matcher, desc] of matchers) {
  console.log(`  ${matcher.padEnd(32)} ${desc}`);
}

// Common mistake: `toBe` on an object or array compares REFERENCES, not contents.
//   expect([1, 2, 3]).toBe([1, 2, 3]);      // FAILS — different array references
//   expect([1, 2, 3]).toEqual([1, 2, 3]);   // PASSES — deep equality

// =============================================================================
// 6. RUNNING VITEST
// =============================================================================

const commands: [string, string][] = [
  ["npm run test", "run all tests once, exit with code 1 on failure (CI mode)"],
  ["npm run test:watch", "watch mode — reruns on file change"],
  ["npx vitest run path/to/file", "run a single file"],
  ['npx vitest run -t "pattern"', "run tests whose names match the pattern"],
  ["npx vitest --coverage", "generate a coverage report (uses c8 or istanbul)"],
  ["npx vitest --ui", "open the interactive browser UI"],
];

console.log("\n=== running tests ===");
for (const [cmd, desc] of commands) {
  console.log(`  ${cmd.padEnd(36)} ${desc}`);
}

// =============================================================================
// 7. STRUCTURE: ARRANGE / ACT / ASSERT
// =============================================================================

// A good test has three visual sections. Many Python devs know this as AAA.
//
//   it("returns the user when found", () => {
//     // ARRANGE — set up the world
//     const repo = new InMemoryUserRepo();
//     repo.save({ id: "u1", name: "Morgan", age: 30 });
//
//     // ACT — do the thing
//     const result = repo.findById("u1");
//
//     // ASSERT — verify the outcome
//     expect(result?.name).toBe("Morgan");
//   });
//
// One assertion per test is a nice ideal — but if multiple assertions are
// verifying the SAME behaviour, group them. Don't be dogmatic.

// =============================================================================
// 8. GOOD TEST NAMES
// =============================================================================

// Names read in the output when tests fail. Make them describe BEHAVIOUR.

const bad = [
  'it("works", ...)',
  'it("add test", ...)',
  'it("returns 5", ...)',
];

const good = [
  'it("sums two positive numbers", ...)',
  'it("throws when name is empty", ...)',
  'it("returns an empty array for an empty input", ...)',
];

console.log("\n=== test names ===");
console.log("  ✗ bad:");
for (const b of bad) console.log(`      ${b}`);
console.log("  ✓ good:");
for (const g of good) console.log(`      ${g}`);

// describe blocks should name the THING (function, class, module).
// it blocks should name the BEHAVIOUR (what it does, when).
// Read them together: "add > sums two positive numbers" — reads like English.

// =============================================================================
// 9. SETUP AND TEARDOWN
// =============================================================================

// Vitest has lifecycle hooks — same names as Jest/pytest fixtures (roughly).
//
//   beforeAll(fn)   — runs once before the describe block
//   afterAll(fn)    — runs once after
//   beforeEach(fn)  — runs before EACH test in the block
//   afterEach(fn)   — runs after each test
//
// Use beforeEach to create a fresh fixture per test — prevents leakage.
// Use beforeAll sparingly — it's a magnet for test-order bugs.

// Example (pseudo-code — real version is in the .test.ts file):
//
//   describe("UserRepo", () => {
//     let repo: UserRepo;
//     beforeEach(() => {
//       repo = new InMemoryUserRepo();
//       repo.save({ id: "u1", name: "Morgan", age: 30 });
//     });
//     it("finds a user by id", () => { ... });
//     it("returns undefined for a missing id", () => { ... });
//   });

// =============================================================================
// 10. WHAT TO TEST (AND WHAT NOT TO)
// =============================================================================

// Test:
//   - Pure functions (easiest wins)
//   - Business logic and validation
//   - Edge cases (empty input, zero, null, max/min)
//   - Error paths — not just the happy path
//   - Regression fixes — every bug becomes a test
//
// Don't test:
//   - Third-party libraries (trust them until proven otherwise)
//   - Getters/setters with no logic
//   - The TypeScript type system itself
//   - Implementation details (private methods, internal state names)
//
// A good test verifies BEHAVIOUR you care about. If you rename a private
// method and tests break, your tests are too tightly coupled.

// =============================================================================
// EXERCISES
// =============================================================================
// 1. Run `npm run test` now. You should see all the tests in the companion
//    .test.ts file pass. If they don't, read the errors and investigate.
//
// 2. Open 01-vitest-intro.test.ts. Add a new test that asserts
//    uniq([]) returns an empty array. Run `npm run test:watch` and watch it
//    pass immediately.
//
// 3. Write a new pure function here — `slugify(input: string): string` — that
//    lowercases the input, replaces spaces with "-", and strips non-alphanumeric
//    characters. Export it. Then write 3+ tests for it in the .test.ts file,
//    including edge cases (empty string, all punctuation, mixed case).
//
// 4. Try making one of the existing tests FAIL deliberately — change `.toBe(5)`
//    to `.toBe(6)`. Look at the failure output. Fix it. This is what a real
//    failure will look like in CI.
//
// 5. (Bonus) Add a `describe.skip(...)` around one block. Run tests — notice
//    how those are reported as skipped, not failing. Useful for TODO tests.

console.log("\n--- Lesson 01 complete --- vitest intro (run: npm run test)");

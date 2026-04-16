// Lesson 04: Project structure and test workflow
// Run this file:  npx tsx lessons/06-testing/04-project-structure.ts
//
// No companion .test.ts file for this one — it's about the big picture:
// how real TS projects are laid out, where tests live, how CI runs them,
// and how to keep a codebase testable as it grows.

// =============================================================================
// 1. A TYPICAL TS PROJECT LAYOUT
// =============================================================================

// Python equivalent: src-layout vs flat-layout debate.
// TS: less religious war, a few common patterns.

const layout = `
  my-app/
  ├── src/
  │   ├── domain/              # pure business logic (easiest to test)
  │   │   ├── order.ts
  │   │   └── order.test.ts    # co-located
  │   ├── infra/               # boundaries — DB, HTTP, FS clients
  │   │   ├── db.ts
  │   │   └── http.ts
  │   ├── app/                 # wiring: composes domain + infra
  │   │   └── order-service.ts
  │   └── main.ts              # entry point — builds the graph, starts server
  ├── tests/                   # higher-level tests: integration, e2e
  │   ├── integration/
  │   └── e2e/
  ├── package.json
  ├── tsconfig.json
  ├── vitest.config.ts
  └── eslint.config.js
`;

console.log("=== typical layout ===");
console.log(layout);

// Notes:
//   - `src/` holds ALL source. Tests live alongside for unit tests, or in
//     a separate `tests/` tree for cross-cutting ones.
//   - `domain/` code has no I/O — it's the cheapest to test and the most
//     valuable to test well.
//   - `infra/` is mostly thin wrappers. Small amount of unit testing, more
//     integration testing.
//   - `app/` wires the pieces. Integration tests live here.
//   - `main.ts` is almost untested — it's just composition.

// =============================================================================
// 2. THE TESTING PYRAMID
// =============================================================================

const pyramid = `
                  /\\
                 /E2\\              few, slow, high-confidence
                /----\\             (real browser, real DB)
               /Integ-\\
              /  ration\\           some, medium speed
             /----------\\          (boundaries stubbed, internals real)
            /    Unit    \\
           /--------------\\        many, fast, deterministic
                                   (pure logic, fakes/mocks for the rest)
`;

console.log("=== testing pyramid ===");
console.log(pyramid);

// Aim for lots of unit tests, fewer integration tests, a handful of end-to-end.
// Tests get slower and flakier as you go up — and they block CI longer.
// The inverted pyramid (many E2E, few unit) is a classic anti-pattern: slow
// feedback, painful debugging, false confidence when tests do pass.

// =============================================================================
// 3. vitest.config.ts
// =============================================================================

// Vitest reads config from `vitest.config.ts` at the project root.
// Common fields:

const configExample = `
  // vitest.config.ts
  import { defineConfig } from "vitest/config";

  export default defineConfig({
    test: {
      // Auto-restore mocks + unstub envs between tests — keeps tests hermetic.
      restoreMocks: true,
      unstubEnvs: true,

      // Only include tests from these paths:
      include: ["src/**/*.{test,spec}.ts", "lessons/**/*.test.ts"],

      // Run in a Node environment. Use "jsdom" for browser-like DOM APIs,
      // or "happy-dom" for a faster DOM alternative.
      environment: "node",

      // Global setup — runs once before all tests. Rarely needed.
      // globalSetup: "./tests/global-setup.ts",

      // Per-file setup — runs before each TEST FILE. Useful for DB seeds.
      // setupFiles: ["./tests/setup.ts"],

      coverage: {
        reporter: ["text", "html", "lcov"],
        include: ["src/**/*.ts"],
        exclude: ["src/**/*.test.ts", "src/main.ts"],
        thresholds: {
          lines: 80,
          functions: 80,
          branches: 70,
          statements: 80,
        },
      },
    },
  });
`;

console.log("=== vitest.config.ts example ===");
console.log(configExample);

// We don't have a vitest.config.ts in this repo yet — Vitest uses sensible
// defaults and picks up **/*.test.ts automatically. As the repo grows, adding
// one lets you set repo-wide policies like restoreMocks.

// =============================================================================
// 4. COVERAGE
// =============================================================================

// Run: `npx vitest --coverage` or add `"test:coverage": "vitest run --coverage"`
//
// Coverage tells you WHICH lines and branches ran during tests. It does NOT
// tell you whether you tested the right thing.
//
// High coverage with weak assertions is worse than medium coverage with
// strong ones. Use coverage as a SAFETY NET — "did I forget this file
// entirely?" — not as a quality score.
//
// Typical sensible floor: 70-80% lines and branches on domain code. Infra
// and glue code needs less. `main.ts` rarely benefits from coverage at all.
//
// In CI, fail the build if coverage drops. Prevents silent erosion.

// =============================================================================
// 5. PYTHON ↔ TYPESCRIPT WORKFLOW
// =============================================================================

const comparison: [string, string, string][] = [
  ["Run all tests", "pytest", "npm run test / npx vitest run"],
  ["Run one file", "pytest path/to/file.py", "npx vitest run path/to/file.ts"],
  ["Run by name", 'pytest -k "name"', 'npx vitest run -t "name"'],
  ["Watch mode", "pytest-watch", "npm run test:watch"],
  ["Fixtures", "@pytest.fixture", "beforeEach / beforeAll"],
  ["Parametrize", "@pytest.mark.parametrize", "it.each / test.each"],
  ["Mark skip", "@pytest.mark.skip", "it.skip / describe.skip"],
  ["Coverage", "coverage run / pytest-cov", "vitest --coverage"],
  ["Async", "pytest-asyncio", "built in (just use async fn)"],
  ["Fake time", "freezegun", "vi.useFakeTimers + setSystemTime"],
];

console.log("\n=== Python ↔ TypeScript testing ===");
for (const [task, py, ts] of comparison) {
  console.log(`  ${task.padEnd(14)} py: ${py.padEnd(30)} ts: ${ts}`);
}

// =============================================================================
// 6. CI INTEGRATION
// =============================================================================

// A minimal GitHub Actions workflow for this project:

const ciYaml = `
  # .github/workflows/ci.yml
  name: ci
  on:
    push: { branches: [main] }
    pull_request:
  jobs:
    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with: { node-version: 20, cache: npm }
        - run: npm ci
        - run: npm run typecheck
        - run: npm run lint
        - run: npm run format:check
        - run: npm run test
`;

console.log("=== CI workflow ===");
console.log(ciYaml);

// The four-command check (typecheck, lint, format, test) is the minimum viable
// CI for a TS project. Runs in seconds for small repos, catches most mistakes
// before review. Add coverage + build as the project grows.

// =============================================================================
// 7. TEST-DRIVEN DESIGN
// =============================================================================

// Hard-to-test code is often hard-to-change code. A few rules that keep
// things testable as the codebase grows:
//
//   INJECT dependencies (don't construct them inside). Clock, notifier,
//   HTTP client, random — take them as constructor/function args.
//
//   KEEP domain logic PURE. Functions that take data and return data are
//   trivial to test. Move side effects to the edges (infra/).
//
//   AVOID SINGLETONS and module-level state. Hard to reset between tests,
//   hard to parallelise, hard to reason about.
//
//   SEPARATE "what" from "how". The "what" (domain) has no infra imports.
//   The "how" (infra) is thin and swappable.
//
// When a test is hard to write, the PRODUCTION code is usually the problem.
// Refactor for testability — the production code will be better off too.

// =============================================================================
// 8. WHAT "GOOD TESTS" LOOK LIKE
// =============================================================================

const goodTests = [
  "Fast — every file runs in well under a second",
  "Deterministic — no flakes, ever. If it flakes once, quarantine and fix it",
  "Independent — any order, any subset; no shared mutable state",
  "Readable — the test body reads like a specification of the behaviour",
  "Focused — one behaviour per test; failure message tells you what broke",
  "Hermetic — no network, no disk, no real time (at the unit level)",
  "Maintained — delete tests that no longer justify their cost",
];

console.log("=== good tests ===");
for (const rule of goodTests) {
  console.log(`  • ${rule}`);
}

// =============================================================================
// 9. SNAPSHOT TESTING (USE SPARINGLY)
// =============================================================================

// Vitest has toMatchSnapshot() and toMatchInlineSnapshot().
//
//   expect(formatInvoice(invoice)).toMatchSnapshot();
//
// On first run, Vitest writes the value to a .snap file. On later runs, it
// compares. If the value changes intentionally, run `vitest -u` to update.
//
// When they're great:
//   - CLI output, HTML rendering, complex serialised objects
//   - "I want to notice if this changes, but I don't want to write assertions
//     for every field"
//
// When they're a trap:
//   - Snapshots grow stale. Updating becomes a rubber-stamp — you stop
//     noticing what actually changed.
//   - Flaky data (timestamps, random ids) in the snapshot causes churn.
//
// Rule of thumb: if you find yourself running `vitest -u` often without
// thinking, your tests are snapshot-heavy and probably not catching anything.
// Prefer explicit expect().toEqual() for important shapes.

// =============================================================================
// 10. WHAT TO TEST IN THE UPCOMING REST API PROJECT
// =============================================================================

// Project 02 (REST API) unlocks at the end of Week 6. When you get there,
// every concept from this week will map to a concrete file:
//
//   domain/                 — pure routing/validation/domain logic → unit test
//   domain/*.test.ts        — Vitest, no HTTP, no DB
//
//   infra/http.ts           — Express/Fastify glue → thin, lightly tested
//   infra/db.ts             — DB client wrapper → integration test against a
//                             real DB instance (usually docker-compose)
//
//   tests/integration/*.ts  — spin up the app, real DB, hit real endpoints
//                             with fetch. A few smoke tests, not exhaustive.
//
// You do NOT need browser/E2E tests yet — those come with the React dashboard
// in Week 11-12.

// =============================================================================
// EXERCISES
// =============================================================================
// 1. Create a `vitest.config.ts` at the project root. Set `restoreMocks: true`
//    and `unstubEnvs: true`. Run `npm run test` and verify all existing tests
//    still pass.
//
// 2. Run `npx vitest --coverage` for the first time. Open the HTML report
//    (it lives at `coverage/index.html`). Which files have 0% coverage?
//    Which lessons/functions are missing tests entirely?
//
// 3. Look back at the CLI tool project (projects/01-cli-tool). Pick ONE
//    function in src/ that has no test yet. Write a `*.test.ts` file next
//    to it with at least two tests: a happy path and an edge case.
//
// 4. Look at one of the existing test files in this directory. Does it test
//    any IMPLEMENTATION DETAILS (private fields, internal method order)?
//    If so, refactor the test to go through the public API instead.
//
// 5. (Bonus) Add a GitHub Actions workflow (.github/workflows/ci.yml) that
//    runs typecheck, lint, format:check, and test on every push. Confirm
//    it goes green before enabling branch protection.

console.log("\n--- Lesson 04 complete --- project structure");
console.log("\n🎉 Week 6 complete! Next up: project 02 — REST API.");

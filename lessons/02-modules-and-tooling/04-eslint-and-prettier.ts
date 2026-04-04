// Lesson 04: ESLint & Prettier — Linting and Formatting
// Run with: npx tsx lessons/02-modules-and-tooling/04-eslint-and-prettier.ts

// =============================================================================
// 1. TWO TOOLS, TWO JOBS
// =============================================================================

// Python equivalents:
//   Prettier  →  Black (code formatter — makes code look consistent)
//   ESLint    →  Ruff/Flake8 + some pylint (linter — catches bugs and bad patterns)
//
// Key rule: Prettier handles STYLE, ESLint handles LOGIC.
// They don't overlap — and that's by design.
//
//   Prettier: "Should this brace be on the same line?"    → YES, always.
//   ESLint:   "Did you forget to await this promise?"     → Bug! Fix it.

// =============================================================================
// 2. PRETTIER — THE FORMATTER
// =============================================================================

// Prettier is opinionated — it has very few settings, and that's the point.
// You don't argue about formatting; Prettier decides. Like Black for Python.

// Our Prettier config (from package.json or .prettierrc):
// By default, Prettier uses:
//   - 80 char line width (configurable)
//   - 2-space indentation (standard in JS/TS — NOT 4 like Python)
//   - Double quotes for strings (configurable, some teams prefer single)
//   - Trailing commas where valid
//   - Semicolons (configurable)

// Run Prettier:
//   npm run format         → format all files in place
//   npm run format:check   → check without changing (for CI)

// What Prettier formats:
// - .ts, .js — code formatting
// - .json — consistent indentation
// - .md — markdown normalization
// - .css, .html, .yaml, and more

console.log("=== Prettier in action ===");

// Prettier would reformat this:
//
//   const ugly={name:"Morgan",age:30,languages:["Python","TypeScript"],active:true}
//
// Into this:
//
//   const ugly = {
//     name: "Morgan",
//     age: 30,
//     languages: ["Python", "TypeScript"],
//     active: true,
//   };

// You don't run Prettier manually — your editor does it on save.
// VS Code: install the Prettier extension, then add to settings.json:
//   "editor.defaultFormatter": "esbenp.prettier-vscode",
//   "editor.formatOnSave": true

// =============================================================================
// 3. ESLINT — THE LINTER
// =============================================================================

// ESLint catches actual problems: unused variables, missing awaits,
// unreachable code, type errors that tsc misses, and more.

// Our setup uses @typescript-eslint — ESLint rules that understand TS types.
// This is critical: base ESLint only understands JS. The TS plugin adds
// rules that leverage the type system.

// Run ESLint:
//   npm run lint        → check for problems
//   npm run lint:fix    → auto-fix what it can

console.log("\n=== ESLint catches these ===");

// Example 1: Unused variables
// const unused = "I'm never used";  // ESLint: '@typescript-eslint/no-unused-vars'

// Example 2: Floating promises (forgetting to await)
// async function fetchData() { return "data"; }
// fetchData();  // ESLint: '@typescript-eslint/no-floating-promises'
//               // Should be: await fetchData(); or void fetchData();

// Example 3: Explicit any
// function process(data: any) {}  // ESLint: '@typescript-eslint/no-explicit-any'
//                                 // Our config makes this an error

// Example 4: Unnecessary type assertion
// const x = "hello" as string;  // ESLint: '@typescript-eslint/no-unnecessary-type-assertion'
//                                // "hello" is already a string!

// =============================================================================
// 4. HOW ESLINT AND PRETTIER COEXIST
// =============================================================================

// Problem: ESLint has some formatting rules too. They can conflict with Prettier.
// Solution: eslint-config-prettier DISABLES all ESLint formatting rules.
//
// In our .eslintrc or eslint.config:
//   extends: ["prettier"]  // turns off formatting rules
//
// Workflow:
//   1. ESLint checks logic (no style opinions)
//   2. Prettier formats code (no logic opinions)
//   3. No conflicts

// Some teams use eslint-plugin-prettier to run Prettier AS an ESLint rule.
// We don't — it's slower and the error messages are confusing.
// Better: run them separately.

// =============================================================================
// 5. CONFIGURING ESLINT
// =============================================================================

// ESLint config lives in eslint.config.js (flat config, the modern way)
// or .eslintrc.json/.eslintrc.js (legacy format — still common).

// Key concepts:
//
// Rules — individual checks. Each can be "off", "warn", or "error".
//   rules: {
//     "@typescript-eslint/no-explicit-any": "error",
//     "@typescript-eslint/no-unused-vars": "warn",
//   }
//
// Extends — preset rule collections.
//   extends: [
//     "eslint:recommended",                          // base JS rules
//     "plugin:@typescript-eslint/recommended",        // TS-aware rules
//     "prettier",                                     // disable formatting rules
//   ]
//
// Parser — tells ESLint how to read TS.
//   parser: "@typescript-eslint/parser"
//
// Plugins — add new rules (like @typescript-eslint).

// =============================================================================
// 6. THE LINT-FORMAT WORKFLOW
// =============================================================================

console.log("\n=== Development workflow ===");

const workflow = [
  "1. Write code in VS Code",
  "2. On save: Prettier formats automatically",
  "3. ESLint extension shows squiggly lines for problems",
  "4. Fix problems as you go",
  "5. Before commit: `npm run lint` catches anything missed",
  "6. CI runs: `npm run lint` + `npm run format:check`",
];

for (const step of workflow) {
  console.log(`  ${step}`);
}

// Many teams add a pre-commit hook (using husky + lint-staged) that runs
// Prettier and ESLint automatically before every commit.
// This prevents unformatted or broken code from ever reaching the repo.

// =============================================================================
// 7. VS CODE INTEGRATION
// =============================================================================

// Essential VS Code extensions for this stack:
//
// 1. ESLint (dbaeumer.vscode-eslint)
//    - Shows lint errors inline as you type
//    - Can auto-fix on save
//
// 2. Prettier (esbenp.prettier-vscode)
//    - Formats on save
//    - Set as default formatter
//
// Recommended .vscode/settings.json:
// {
//   "editor.defaultFormatter": "esbenp.prettier-vscode",
//   "editor.formatOnSave": true,
//   "editor.codeActionsOnSave": {
//     "source.fixAll.eslint": "explicit"
//   }
// }
//
// With this setup, saving a file automatically:
// - Formats with Prettier
// - Auto-fixes ESLint issues (like sorting imports)

// =============================================================================
// 8. COMPARING WITH PYTHON TOOLING
// =============================================================================

console.log("\n=== Python ↔ TypeScript tooling comparison ===");

const comparisons: [string, string, string][] = [
  ["Formatter", "Black / Ruff format", "Prettier"],
  ["Linter", "Ruff / Flake8 / Pylint", "ESLint + @typescript-eslint"],
  ["Type checker", "mypy / pyright", "tsc (built into TypeScript)"],
  ["Config file", "pyproject.toml", "tsconfig.json + eslint.config.js"],
  ["Package manager", "uv / pip / poetry", "npm / pnpm / yarn"],
  ["Task runner", "Makefile / poe", "npm scripts"],
  ["Pre-commit", "pre-commit framework", "husky + lint-staged"],
];

for (const [category, python, ts] of comparisons) {
  console.log(`  ${category.padEnd(16)} Python: ${python.padEnd(26)} TS: ${ts}`);
}

// The big difference: Python's tooling is fragmented (many choices, each incomplete).
// TS's tooling is more consolidated: tsc + ESLint + Prettier covers almost everything.

// =============================================================================
// EXERCISES: Try these in your terminal and editor
// =============================================================================
// 1. Run `npm run lint` — are there any lint errors in our project?
//    If so, try `npm run lint:fix` to auto-fix what it can.
//
// 2. Run `npm run format:check` — is all our code formatted?
//    If not, run `npm run format` to fix it.
//
// 3. In VS Code, intentionally write a lint error:
//      const unused = "test";
//    Save the file — does ESLint highlight it? Does Prettier reformat?
//
// 4. Try disabling a lint rule inline (like Python's # noqa):
//      // eslint-disable-next-line @typescript-eslint/no-unused-vars
//      const intentionallyUnused = "needed for demo";
//    This is the TS equivalent of `# type: ignore` or `# noqa`.
//
// 5. (Bonus) Look at our ESLint config file. Try adding a new rule:
//      "@typescript-eslint/prefer-const": "error"
//    Then run lint — does it catch any `let` that should be `const`?

console.log("\n--- Lesson 04 complete --- ESLint & Prettier");
console.log("\n🎉 Week 3 modules & tooling complete!");
console.log("Next up: async/await, Promises, and error handling.");

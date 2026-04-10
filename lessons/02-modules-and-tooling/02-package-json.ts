// Lesson 02: package.json — Your Project's Manifest
// Run with: npx tsx lessons/02-modules-and-tooling/02-package-json.ts

// This lesson is more "read and understand" than "write code."
// We'll walk through our project's package.json field by field, then experiment.

// =============================================================================
// 1. WHAT IS package.json?
// =============================================================================

// Python equivalent: pyproject.toml (or the older setup.py + requirements.txt)
// It declares: your project's name, dependencies, scripts, and module format.
// Every Node/TS project has one at the root.

// Let's read ours:
import { readFileSync } from "node:fs";
import { join } from "node:path";

const pkg = JSON.parse(readFileSync(join(import.meta.dirname!, "../../package.json"), "utf-8"));

console.log("=== Our package.json ===");
console.log(`Name: ${pkg.name}`);
console.log(`Version: ${pkg.version}`);
console.log(`Type: ${pkg.type}`);

// =============================================================================
// 2. KEY FIELDS EXPLAINED
// =============================================================================

// --- "name" and "version" ---
// Like pyproject.toml's [project] name and version.
// Required if you publish to npm. For private projects, mostly informational.

// --- "type": "module" ---
// This is CRITICAL. It tells Node to treat .js files as ES modules (import/export)
// instead of CommonJS (require/module.exports).
//
// Without this: Node defaults to CommonJS, and your `import` statements fail.
// With this: ESM everywhere. This is what modern TS projects should use.
//
// Python analogy: it's like Python 2→3 — the ecosystem moved from CJS to ESM,
// and `"type": "module"` opts you into the new world.

console.log("\n=== Scripts ===");
for (const [name, cmd] of Object.entries(pkg.scripts as Record<string, string>)) {
  console.log(`  npm run ${name.padEnd(14)} → ${cmd}`);
}

// --- "scripts" ---
// Python equivalent: Makefile targets, or the [tool.poe.tasks] in pyproject.toml
//
// Run with: npm run <name>
// Special scripts: "test", "start", "build" can also run as `npm test`, etc.
//
// Our scripts:
//   build       — compile TS to JS (tsc)
//   typecheck   — check types without emitting files (tsc --noEmit)
//   lint        — run ESLint on lesson and project files
//   format      — run Prettier on everything
//   test        — run Vitest

// =============================================================================
// 3. DEPENDENCIES vs devDependencies
// =============================================================================

console.log("\n=== devDependencies ===");
for (const [name, version] of Object.entries(pkg.devDependencies as Record<string, string>)) {
  console.log(`  ${name.padEnd(42)} ${version}`);
}

// Python: requirements.txt vs requirements-dev.txt (or [project.optional-dependencies])
//
// dependencies      — needed at runtime (express, zod, etc.)
// devDependencies   — needed only for development (typescript, eslint, vitest, etc.)
//
// We only have devDependencies right now because we're a learning project,
// not a library or server. When we build the REST API project (Week 6),
// we'll add runtime dependencies.
//
// Install commands:
//   npm install express          → adds to dependencies
//   npm install -D vitest        → adds to devDependencies (-D = --save-dev)

// =============================================================================
// 4. VERSION RANGES (semver)
// =============================================================================

// You'll see these patterns in dependency versions:
//
//   "^5.9.3"   — compatible with 5.x.x (caret: allows minor + patch updates)
//   "~5.9.3"   — approximately 5.9.x (tilde: allows patch updates only)
//   "5.9.3"    — exact version (locked)
//   ">=5.0.0"  — any version 5.0.0 or higher
//   "*"        — any version (dangerous!)
//
// ^ (caret) is the default and most common. npm install adds "^x.y.z".
// The idea: minor versions add features (safe), major versions break things (risky).
//
// Python analogy: like `package>=5.9,<6.0` in requirements.txt.

// =============================================================================
// 5. package-lock.json
// =============================================================================

// Python: uv.lock, pip freeze, or poetry.lock
// npm creates package-lock.json automatically when you install.
//
// It pins the EXACT versions of every dependency (and their dependencies).
// This ensures everyone on the team gets identical installs.
//
// Rules:
// - ALWAYS commit package-lock.json to git
// - NEVER edit it manually
// - Run `npm ci` in CI/CD (clean install from lock file, faster + stricter)
// - Run `npm install` locally (updates lock file if package.json changed)

// =============================================================================
// 6. node_modules
// =============================================================================

// Python: .venv or site-packages
// npm installs all packages into node_modules/ at the project root.
//
// Key differences from Python:
// - node_modules is ALWAYS project-local (no global site-packages mess)
// - It's in .gitignore — never committed
// - It can be HUGE (hundreds of MB). This is normal and expected.
// - `npm install` recreates it from package-lock.json
//
// If something feels broken: delete node_modules and reinstall.
//   rm -rf node_modules && npm install
// This is the Node equivalent of "have you tried turning it off and on again."

// =============================================================================
// 7. npm vs OTHER PACKAGE MANAGERS
// =============================================================================

// You'll encounter these:
//
// npm   — ships with Node. We use this. Reliable, universal.
// yarn  — Facebook's alternative. Faster installs, workspaces. Declining share.
// pnpm  — faster, disk-efficient (hard links). Growing in popularity.
// bun   — all-in-one runtime + package manager. Very fast. Newer.
//
// They all read package.json. The differences are in speed, disk usage, and
// lock file format. For learning, npm is fine. We'll try pnpm later.
//
// Python analogy: pip vs uv vs poetry vs conda. Same ecosystem, different tools.

// =============================================================================
// 8. USEFUL npm COMMANDS
// =============================================================================

console.log("\n=== Common npm commands ===");
const commands = [
  ["npm install", "Install all dependencies from package.json"],
  ["npm install <pkg>", "Add a runtime dependency"],
  ["npm install -D <pkg>", "Add a dev dependency"],
  ["npm uninstall <pkg>", "Remove a dependency"],
  ["npm run <script>", "Run a script from package.json"],
  ["npm test", "Shortcut for npm run test"],
  ["npm ci", "Clean install (CI/CD — uses lock file exactly)"],
  ["npm outdated", "Show which dependencies have newer versions"],
  ["npm update", "Update dependencies within semver range"],
  ["npx <cmd>", "Run a locally installed CLI tool (e.g., npx tsc)"],
];

for (const [cmd, desc] of commands) {
  console.log(`  ${cmd.padEnd(26)} — ${desc}`);
}

// =============================================================================
// EXERCISES: Try these in your terminal
// =============================================================================
// 1. Run `npm outdated` — are any of our dependencies behind?
//
// 2. Run `npm ls` — see the dependency tree. Compare with `npm ls --depth=0`.
//
// 3. Run `npm run typecheck` — this runs tsc --noEmit. What does it report?
//
// 4. Try installing a package you know from Python:
//      npm install -D chalk
//    Then import it in a scratch file:
//      import chalk from "chalk";
//      console.log(chalk.green("It works!"));
//    When done, remove it: npm uninstall chalk
//
// 5. (Bonus) Open package-lock.json and find the entry for "typescript".
//    Notice how it pins an exact version and lists its integrity hash.

console.log("\n--- Lesson 02 complete --- package.json");

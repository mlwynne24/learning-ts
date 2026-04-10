// Lesson 03: tsconfig.json — TypeScript's Configuration
// Run with: npx tsx lessons/02-modules-and-tooling/03-tsconfig.ts

// =============================================================================
// 1. WHAT IS tsconfig.json?
// =============================================================================

// Python equivalent: mypy.ini or the [tool.mypy] section of pyproject.toml
// It tells the TypeScript compiler (tsc) how to check and compile your code.

// When you run `tsc` or `npm run typecheck`, TS looks for tsconfig.json
// in the project root and follows its instructions.

// Let's read ours and walk through every field:
import { readFileSync } from "node:fs";
import { join } from "node:path";

const tsconfig = JSON.parse(
  readFileSync(join(import.meta.dirname!, "../../tsconfig.json"), "utf-8"),
);

console.log("=== Our tsconfig.json ===");
console.log(JSON.stringify(tsconfig, null, 2));

// =============================================================================
// 2. compilerOptions — THE BIG ONE
// =============================================================================

// This is where all the important settings live. Let's go field by field.

// --- "target": "ES2022" ---
// What JS version to compile down to.
// ES2022 gives us top-level await, .at(), error.cause, etc.
// Since we're running on Node 20+, we don't need to target older versions.
// Python analogy: like specifying `python_requires = ">=3.11"` — setting a floor.

// --- "module": "Node16" ---
// What module system the OUTPUT should use.
// "Node16" means: follow Node's native ESM rules.
// This is why we write `import ... from "./file.js"` (with .js extension).
// Combined with `"type": "module"` in package.json, this gives us proper ESM.

// --- "moduleResolution": "Node16" ---
// How TS FINDS modules when you write `import { x } from "y"`.
// "Node16" matches Node's actual resolution algorithm:
//   - Relative paths: looks for the file with .ts/.js extension
//   - Package names: looks in node_modules/
//   - Respects package.json "exports" field (modern node packages use this)

// --- "strict": true ---
// THE most important setting. Enables ALL strict type-checking options:
//   strictNullChecks        — null/undefined are distinct types
//   noImplicitAny           — must annotate when TS can't infer
//   strictFunctionTypes     — stricter function parameter checking
//   strictPropertyInitialization — class properties must be initialized
//   ... and more
//
// Python analogy: like running mypy with `--strict`. Non-negotiable for real projects.
// ALWAYS keep this on. Turning it off is like removing your seatbelt.

console.log("\n=== Strict mode effects ===");

// With strict: true, this would fail:
// function greet(name) {         // Error: Parameter 'name' implicitly has an 'any' type
//   return `Hello, ${name}`;
// }

// You must annotate:
function greet(name: string): string {
  return `Hello, ${name}`;
}

// With strictNullChecks, you can't ignore null:
function getLength(s: string | null): number {
  // return s.length;  // Error: 's' is possibly 'null'
  return s?.length ?? 0; // Safe — handles null
}

console.log(`greet: ${greet("Morgan")}`);
console.log(`getLength(null): ${getLength(null)}`);
console.log(`getLength("hello"): ${getLength("hello")}`);

// =============================================================================
// 3. MORE compilerOptions EXPLAINED
// =============================================================================

// --- "esModuleInterop": true ---
// Smooths over differences between CommonJS and ESM imports.
// Without it: `import express from "express"` might fail for CJS packages.
// With it: default imports work as expected. Always enable this.

// --- "skipLibCheck": true ---
// Don't type-check .d.ts files in node_modules.
// Speeds up compilation significantly. Safe because library types are
// already checked by their authors. Always enable this.

// --- "forceConsistentCasingInFileNames": true ---
// Prevents `import from "./File"` when the file is actually `./file`.
// macOS/Windows have case-insensitive filesystems — code that works locally
// can break on Linux CI servers. This catches it at compile time.

// --- "outDir": "dist" ---
// Where compiled .js files go. We don't use this much (we run .ts directly
// with ts-node) but `npm run build` will compile everything to dist/.

// --- "rootDir": "." ---
// The root of our source tree. Affects the output directory structure.
// With rootDir ".", the compiled file for lessons/02-modules.../01-es-modules.ts
// goes to dist/lessons/02-modules.../01-es-modules.js.

// --- "declaration": true ---
// Generate .d.ts type declaration files alongside .js output.
// Essential for libraries (so consumers get type info).
// Not strictly needed for applications, but doesn't hurt.

// --- "resolveJsonModule": true ---
// Allows importing .json files:
//   import data from "./data.json";
// TS infers the type from the JSON structure. Very handy.

// --- "sourceMap": true ---
// Generate .js.map files for debugging. These let the VS Code debugger
// show your original .ts source when stepping through compiled .js code.

// =============================================================================
// 4. include AND exclude
// =============================================================================

console.log("\n=== File inclusion ===");
console.log(`Include: ${JSON.stringify(tsconfig.include)}`);
console.log(`Exclude: ${JSON.stringify(tsconfig.exclude)}`);

// "include" — which files TS should compile and type-check.
// Uses glob patterns: "lessons/**/*.ts" means "all .ts files under lessons/"
//
// "exclude" — which directories to skip.
// node_modules and dist are excluded by default, but being explicit is clearer.
//
// If a file isn't in "include", tsc ignores it entirely — no errors, no output.
// But if an included file imports an excluded file, TS will still process it.

// =============================================================================
// 5. COMMON tsconfig PATTERNS
// =============================================================================

// For a Node.js application:
const nodeAppConfig = {
  target: "ES2022",
  module: "Node16",
  moduleResolution: "Node16",
  strict: true,
  esModuleInterop: true,
  skipLibCheck: true,
  outDir: "dist",
};

// For a library (published to npm):
const libraryConfig = {
  ...nodeAppConfig,
  declaration: true, // consumers need .d.ts files
  declarationMap: true, // "go to definition" shows .ts source, not .d.ts
  composite: true, // enables project references
};

// For a React frontend (Vite):
const reactConfig = {
  target: "ES2020",
  module: "ESNext", // bundler handles module format
  moduleResolution: "bundler", // Vite/webpack resolution rules
  jsx: "react-jsx", // handle .tsx files
  strict: true,
};

console.log("\nNode app config keys:", Object.keys(nodeAppConfig).join(", "));
console.log(
  "Library adds:",
  Object.keys(libraryConfig)
    .filter((k) => !(k in nodeAppConfig))
    .join(", "),
);

// =============================================================================
// 6. tsconfig INHERITANCE (extends)
// =============================================================================

// Large projects split config across files:
//
// tsconfig.base.json — shared settings
// tsconfig.json      — extends base, adds project-specific paths
//
// {
//   "extends": "./tsconfig.base.json",
//   "compilerOptions": { "outDir": "dist" },
//   "include": ["src"]
// }
//
// Community bases exist too:
//   npm install -D @tsconfig/node20
//   { "extends": "@tsconfig/node20/tsconfig.json" }
//
// These give you battle-tested defaults for specific environments.

// =============================================================================
// 7. PRACTICAL: COMMON ERRORS AND WHAT THEY MEAN
// =============================================================================

console.log("\n=== Common tsconfig-related errors ===");

const errors = [
  {
    error: "Cannot find module './foo' or its corresponding type declarations",
    cause: "Missing .js extension in import, or file doesn't exist",
    fix: 'Use import from "./foo.js" (even for .ts files)',
  },
  {
    error: "Parameter 'x' implicitly has an 'any' type",
    cause: "strict: true requires type annotations where TS can't infer",
    fix: "Add a type annotation: (x: string) => ...",
  },
  {
    error: "Object is possibly 'undefined'",
    cause: "strictNullChecks: you're accessing something that might be null/undefined",
    fix: "Use optional chaining (?.) or a null check",
  },
  {
    error: "Cannot use import statement outside a module",
    cause: 'Missing "type": "module" in package.json, or wrong module setting',
    fix: 'Add "type": "module" to package.json',
  },
];

for (const { error, cause, fix } of errors) {
  console.log(`\n  Error: ${error}`);
  console.log(`  Cause: ${cause}`);
  console.log(`  Fix:   ${fix}`);
}

// =============================================================================
// EXERCISES
// =============================================================================
// 1. Run `npx tsc --showConfig` to see the fully resolved tsconfig (with defaults).
//    How many settings does `strict: true` actually enable?
//
// 2. Temporarily set "strict": false in tsconfig.json and run `npm run typecheck`.
//    Notice how some errors disappear. Then set it back to true!
//
// 3. Try changing "target" to "ES5" and run `npm run build`. Open a compiled .js
//    file in dist/ — notice how arrow functions become regular functions and
//    template literals become string concatenation. Then change it back.
//
// 4. (Bonus) Install a community base config:
//      npm install -D @tsconfig/node20
//    Create a tsconfig.test.json that extends it and compare with our config.

console.log("\n--- Lesson 03 complete --- tsconfig.json");

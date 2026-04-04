// Lesson 01: ES Modules — import / export
// Run with: npx tsx lessons/02-modules-and-tooling/01-es-modules.ts

// =============================================================================
// 1. WHY MODULES MATTER
// =============================================================================

// Python: every .py file is automatically a module. `import math` just works.
// JS/TS: historically chaotic — CommonJS (require), AMD, UMD, globals...
// Modern TS: ES Modules (ESM) — the standard. This is what you should use.

// A "module" in TS is any file that has at least one `import` or `export`.
// Without those, the file is a "script" — all its declarations are global.
// (That's why our earlier lessons could define `const name` without conflicts —
// they ran as scripts, not modules.)

// This file has imports, so it's a module. Everything here is scoped to this file.

// =============================================================================
// 2. NAMED EXPORTS
// =============================================================================

// Python: functions in a .py file are importable by name
//         from math_utils import add, subtract
// TS:     use the `export` keyword

// --- In a file called math-utils.ts you'd write: ---
//
// export function add(a: number, b: number): number {
//   return a + b;
// }
//
// export function subtract(a: number, b: number): number {
//   return a - b;
// }
//
// export const PI = 3.14159;

// --- Then import them: ---
//
// import { add, subtract, PI } from "./math-utils.js";
//                                    ^^^^^^^^^^^^^^^^^
// Note the ".js" extension! In Node16 module resolution (our tsconfig),
// you import .ts files using the .js extension. This is because TS compiles
// to .js and Node resolves the compiled output. Confusing at first, but
// it's the standard approach.

// For this lesson, we'll demonstrate patterns inline since we're in one file.
// The companion files (helpers/) have real exports to import.

// =============================================================================
// 3. IMPORTING FROM REAL MODULE FILES
// =============================================================================

// We've set up a small helper module to demonstrate real imports.
// See: lessons/02-modules-and-tooling/helpers/math-utils.ts

import { add, subtract, PI } from "./helpers/math-utils.js";

console.log(`add(2, 3) = ${add(2, 3)}`);
console.log(`subtract(10, 4) = ${subtract(10, 4)}`);
console.log(`PI = ${PI}`);

// =============================================================================
// 4. DEFAULT EXPORTS
// =============================================================================

// Python: doesn't really have this concept
// TS:     one "default" export per file + any number of named exports

// --- In a file called logger.ts you'd write: ---
//
// export default class Logger {
//   log(msg: string) { console.log(`[LOG] ${msg}`); }
// }
//
// --- Then import it: ---
//
// import Logger from "./logger.js";       // no braces — it's the default
// import Logger, { someHelper } from "./logger.js";  // default + named

import Logger from "./helpers/logger.js";

const logger = new Logger("Lesson01");
logger.log("Default exports work!");

// When to use default vs named exports?
// - Named exports: preferred in most TS codebases. Explicit, refactor-friendly.
// - Default exports: common for React components and "one class per file" patterns.
// Rule of thumb: use named exports unless you have a good reason not to.

// =============================================================================
// 5. RENAMING IMPORTS
// =============================================================================

// Python: from math_utils import add as addition
// TS:     import { add as addition } from "./math-utils.js"

import { add as addition } from "./helpers/math-utils.js";

console.log(`\nRenamed: addition(5, 5) = ${addition(5, 5)}`);

// Useful when you have naming conflicts between modules.

// =============================================================================
// 6. NAMESPACE IMPORTS
// =============================================================================

// Python: import math_utils   → math_utils.add(...)
// TS:     import * as mathUtils from "./math-utils.js"

import * as mathUtils from "./helpers/math-utils.js";

console.log(`\nNamespace: mathUtils.add(1, 2) = ${mathUtils.add(1, 2)}`);
console.log(`mathUtils.PI = ${mathUtils.PI}`);

// This grabs ALL named exports as an object. Useful when a module has many
// exports and you want to keep them namespaced for clarity.

// =============================================================================
// 7. RE-EXPORTS (barrel files)
// =============================================================================

// Python: __init__.py that imports from submodules
// TS:     index.ts that re-exports from other files

// --- In helpers/index.ts: ---
//
// export { add, subtract, PI } from "./math-utils.js";
// export { default as Logger } from "./logger.js";
//
// --- Then import from the directory: ---
//
// import { add, Logger } from "./helpers/index.js";

// This is called a "barrel file." It gives a clean public API for a directory.
// Consumers don't need to know the internal file structure.

// Caution: barrel files can cause circular dependencies and slow builds in large
// projects. Use them for public-facing boundaries, not deep internal directories.

// =============================================================================
// 8. TYPE-ONLY IMPORTS
// =============================================================================

// TS-specific: import types without importing runtime code.
// This helps bundlers remove unused imports (tree-shaking).

// import type { SomeInterface } from "./types.js";
//        ^^^^
// This import is erased at compile time — no runtime cost.

// You can also inline it:
// import { type SomeInterface, someFunction } from "./module.js";
//          ^^^^
// `SomeInterface` is erased, `someFunction` stays.

import type { MathOperation } from "./helpers/math-utils.js";

// `MathOperation` is only available as a type — you can't use it as a value:
const myOp: MathOperation = (a, b) => a * b;
console.log(`\nType-only import: myOp(3, 4) = ${myOp(3, 4)}`);

// =============================================================================
// 9. IMPORTING NODE BUILT-INS AND npm PACKAGES
// =============================================================================

// Node built-ins use the `node:` prefix:
import { readFileSync } from "node:fs";
import { join } from "node:path";

// The `node:` prefix is optional but recommended — it makes it clear
// you're importing a built-in, not an npm package called "fs".

const thisFile = readFileSync(join(import.meta.dirname!, "01-es-modules.ts"), "utf-8");
console.log(`\nThis file has ${thisFile.split("\n").length} lines`);

// npm packages: just import by package name
// import express from "express";
// import { z } from "zod";

// TypeScript resolves these through node_modules, same as Node.

// =============================================================================
// 10. CommonJS vs ESM — WHAT YOU'LL ENCOUNTER
// =============================================================================

// You'll see `require()` and `module.exports` in older code. That's CommonJS:
//
//   const fs = require("fs");           // CJS import
//   module.exports = { add, subtract }; // CJS export
//
// Our project uses ESM ("type": "module" in package.json).
// Don't mix them. If you need a CJS package in ESM, usually a default import works:
//
//   import chalk from "chalk";  // even if chalk uses CJS internally
//
// Node and bundlers handle the interop. You just write ESM.

// =============================================================================
// EXERCISES: Try these yourself
// =============================================================================
// 1. Create a new file `helpers/string-utils.ts` with:
//    - A named export `capitalize(s: string): string`
//    - A named export `reverse(s: string): string`
//    - A type export `type StringTransform = (s: string) => string`
//    Import all three into this file and use them.
//
// 2. Add the exports from string-utils to the barrel file (helpers/index.ts).
//    Then import from "./helpers/index.js" instead.
//
// 3. Create a `helpers/config.ts` with a default export of a config object.
//    Import it here using both `import config from ...` and
//    `import * as configModule from ...`. Compare what you get.
//
// 4. (Bonus) Try importing a Node built-in with and without the `node:` prefix.
//    Both work — but which gives better editor support? Hover to check types.

console.log("\n--- Lesson 01 complete --- ES modules");

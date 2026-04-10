// Lesson 02: Functions
// Run with: npx ts-node --esm lessons/01-fundamentals/02-functions.ts

// =============================================================================
// 1. BASIC FUNCTION SYNTAX
// =============================================================================

// Python:  def greet(name: str) -> str:
//              return f"Hello, {name}"
//
// TS:      function greet(name: string): string {
//              return `Hello, ${name}`;
//          }

function greet(name: string): string {
  return `Hello, ${name}`;
}

console.log(greet("Morgan"));

// Key differences from Python:
// - Curly braces instead of indentation
// - Return type goes AFTER the params with `: type`
// - Semicolons (optional but conventional)
// - No `def` keyword — just `function`

// =============================================================================
// 2. ARROW FUNCTIONS (the TS/JS way)
// =============================================================================

// Python's lambda is limited to single expressions.
// TS arrow functions are full functions — you'll use these MORE than `function`.

// Python: greet = lambda name: f"Hello, {name}"
// TS:
const greetArrow = (name: string): string => {
  return `Hello, ${name}`;
};

// One-liner shorthand — implicit return (no braces, no `return` keyword):
const greetShort = (name: string): string => `Hello, ${name}`;

console.log(greetArrow("Arrow"));
console.log(greetShort("Short"));

// When to use which?
// - `function` for top-level, standalone functions (hoisted — usable before declaration)
// - Arrow functions for everything else: callbacks, inline, assigned to variables
// In practice, many codebases use arrow functions almost exclusively.

// =============================================================================
// 3. PARAMETER TYPES
// =============================================================================

// --- Optional parameters (Python: def foo(x: str = None)) ---
// Use `?` to mark a parameter as optional. Its type becomes `T | undefined`.

function log(message: string, prefix?: string): void {
  if (prefix) {
    console.log(`[${prefix}] ${message}`);
  } else {
    console.log(message);
  }
}

log("Server started");
log("Connected", "DB");

// --- Default parameters (same idea as Python) ---

function createUser(name: string, role: string = "viewer"): string {
  return `${name} (${role})`;
}

console.log(createUser("Morgan"));
console.log(createUser("Admin", "admin"));

// --- Rest parameters (Python: *args) ---

function sum(...numbers: number[]): number {
  return numbers.reduce((total, n) => total + n, 0);
}

console.log(`Sum: ${sum(1, 2, 3, 4)}`);

// =============================================================================
// 4. RETURN TYPES
// =============================================================================

// TS can usually infer the return type. Hover over these to see:

const add = (a: number, b: number) => a + b; // inferred: number
const isEven = (n: number) => n % 2 === 0; // inferred: boolean

// `void` — function doesn't return anything (like Python's -> None)
function logMessage(msg: string): void {
  console.log(msg);
}

// `never` — function NEVER returns (throws or infinite loop)
function throwError(msg: string): never {
  throw new Error(msg);
}

// When to annotate return types explicitly?
// - Public API functions / exported functions: yes, for documentation
// - Internal / simple functions: let TS infer, it's usually right

console.log(`\nadd(2, 3) = ${add(2, 3)}, isEven(4) = ${isEven(4)}`);

// =============================================================================
// 5. FUNCTION TYPES (typing a variable that holds a function)
// =============================================================================

// Python: Callable[[int, int], int]
// TS:     (a: number, b: number) => number

type MathOp = (a: number, b: number) => number;

const multiply: MathOp = (a, b) => a * b;
const divide: MathOp = (a, b) => a / b;

// This is useful for callbacks:
function applyOp(a: number, b: number, op: MathOp): number {
  return op(a, b);
}

console.log(`\nmultiply: ${applyOp(6, 7, multiply)}`);
console.log(`divide: ${applyOp(10, 3, divide)}`);

// =============================================================================
// 6. OVERLOADS (no Python equivalent)
// =============================================================================

// Sometimes a function behaves differently based on input types.
// TS lets you declare multiple signatures:

function format(value: string): string;
function format(value: number): string;
function format(value: string | number): string {
  if (typeof value === "string") {
    return value.toUpperCase();
  }
  return value.toFixed(2);
}

console.log(`\nformat("hello") = ${format("hello")}`);
console.log(`format(3.14159) = ${format(3.14159)}`);

// The first two lines are the "overload signatures" (what callers see).
// The last one is the "implementation signature" (must handle all cases).
// You won't need overloads often, but you'll see them in library type definitions.

// =============================================================================
// 7. CLOSURES AND HIGHER-ORDER FUNCTIONS
// =============================================================================

// Same concept as Python — functions can return functions and capture variables.

function makeMultiplier(factor: number): (n: number) => number {
  return (n) => n * factor;
}

const double = makeMultiplier(2);
const triple = makeMultiplier(3);

console.log(`\ndouble(5) = ${double(5)}, triple(5) = ${triple(5)}`);

// Common in real TS: array methods (like Python's map/filter/reduce)
const numbers = [1, 2, 3, 4, 5];

const doubled = numbers.map((n) => n * 2);
const evens = numbers.filter((n) => n % 2 === 0);
const total = numbers.reduce((acc, n) => acc + n, 0);

console.log(`doubled: ${doubled}, evens: ${evens}, total: ${total}`);

// =============================================================================
// EXERCISE: Try these in your editor
// =============================================================================
// 1. Write an arrow function `celsiusToFahrenheit` that takes a number and returns a number
//
// 2. Write a function `describePerson` with name (required) and age (optional).
//    Return "Morgan, age 30" or "Morgan, age unknown".
//
// 3. Write a function `applyToAll` that takes a number[] and a function (number) => number,
//    and returns a new number[] with the function applied to each element.
//    (Hint: it's basically Array.map — but write it yourself with a for loop)

// 1
const celsiusToFahrenheit = (degrees: number): number => {
  return degrees * 3;
};
const celsiusToFahrenheit2 = (degrees: number): number => degrees * 3;

// 2
const describePerson = (name: string, age?: number): string => {
  return `${name}, age ${age ?? "unknown"}`;
};
console.log(describePerson("Morgan"));
console.log(describePerson("Morgan", 25));

//3
type FnOp = (n: number) => number;
const applyToAll = (array: number[], fn: FnOp) => {
  let newArray: number[] = [];
  for (const n of array) {
    newArray.push(fn(n));
  }
  return newArray;
};
console.log(applyToAll([5, 2, 6], (n) => n * 2));

console.log("\n--- Lesson 02 complete --- functions");

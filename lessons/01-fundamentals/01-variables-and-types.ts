// Lesson 01: Variables & Types
// Run with: npx ts-node --esm lessons/01-fundamentals/01-variables-and-types.ts

// =============================================================================
// 1. DECLARING VARIABLES
// =============================================================================

// Python: name = "Morgan"          (mutable by default)
// TS:     let name = "Morgan"      (mutable — like Python's default)
//         const name = "Morgan"    (immutable — like Python's final, but enforced)

let language = "TypeScript";
const version = 5.9;

// `let` allows reassignment
language = "TS";

// `const` does NOT — uncomment this to see the compiler error:
// version = 6.0;

// There's also `var` — NEVER use it. It has confusing scoping rules (function-scoped
// instead of block-scoped). You'll see it in old code. Always use `let` or `const`.
// Rule of thumb: use `const` by default, `let` only when you need to reassign.

console.log(`Language: ${language}, Version: ${version}`);
// Template literals use backticks, just like Python f-strings but with ${} instead of {}

// =============================================================================
// 2. BASIC TYPES
// =============================================================================

// Python has: str, int, float, bool, None
// TS has:     string, number, boolean, null, undefined

const name_: string = "Morgan";
const age: number = 30; // No int vs float distinction — it's all `number`
const isLearning: boolean = true;
const nothing: null = null;
const notSet: undefined = undefined;

// Key difference from Python: TS has BOTH null and undefined.
// - undefined = "not yet assigned" (like a variable declared but never set)
// - null = "intentionally empty" (like Python's None)
// In practice, most TS code uses `undefined` more than `null`.

console.log(`\nTypes: ${name_} (${typeof name_}), ${age} (${typeof age}), ${isLearning} (${typeof isLearning})`);

// =============================================================================
// 3. TYPE INFERENCE
// =============================================================================

// You don't ALWAYS need to write the type. TypeScript can infer it.

// Explicit (you write the type):
const explicitCity: string = "London";

// Inferred (TS figures it out):
const inferredCity = "London"; // TS knows this is a `string`

// Hover over `inferredCity` in VS Code — you'll see it's typed as `string`.
// Rule of thumb: let TS infer when it's obvious. Annotate when it's not.

// Where inference shines — TS infers the NARROWEST type for const:
const direction = "north"; // Hover here: type is "north" (a literal type, not string!)
let flexible = "north"; // Hover here: VS Code says "north" too — but that's misleading!
flexible = "south"; // Now hover HERE — VS Code shows `string`, the actual inferred type.

// What's happening: `let` infers the wide type `string` (because you might reassign),
// but VS Code's hover shows "narrowed" types based on what the value is at THAT line.
// `const` locks the type to the exact value permanently — it's `"north"`, not `string`.
// Try this: uncomment the line below. `direction` errors, `flexible` doesn't:
// direction = "south";  // Error: can't reassign const (and type is literally "north")

// This is called a "literal type" — more on this in Week 2.

console.log(`\nInference: ${explicitCity} vs ${inferredCity}`);
console.log(`Literal type: ${direction}, Flexible type: ${flexible}`);

// =============================================================================
// 4. TYPE ERRORS
// =============================================================================

// The whole point of TypeScript — catching errors BEFORE you run your code.

// Uncomment any of these to see compiler errors:

// const broken: number = "hello";      // Type 'string' is not assignable to type 'number'
// let count: number = 10;
// count = "ten";                        // Same error

// In Python, you'd only catch this with mypy or at runtime.
// In TS, `tsc` (the compiler) or your VS Code extension catches it instantly.

// =============================================================================
// 5. ARRAYS
// =============================================================================

// Python: names: list[str] = ["Alice", "Bob"]
// TS:     two syntaxes (both common):

const names: string[] = ["Alice", "Bob"];
const scores: Array<number> = [95, 87, 72]; // Generic syntax — same thing

// Arrays are typed — every element must match:
// names.push(42);  // Error: Argument of type 'number' is not assignable to type 'string'

// Mixed arrays? Use a union type (covered in Week 2):
const mixed: (string | number)[] = ["hello", 42];

console.log(`\nArrays: ${names}, Scores: ${scores}, Mixed: ${mixed}`);

// =============================================================================
// 6. OBJECTS
// =============================================================================

// Python: you'd use a dict or a dataclass/pydantic model
// TS: inline object types

// Explicit object type:
const user: { name: string; age: number; active: boolean } = {
  name: "Morgan",
  age: 30,
  active: true,
};

// With inference (TS figures out the shape):
const project = {
  name: "learning-ts",
  weeks: 16,
  started: true,
};

// Access with dot notation (like Python):
console.log(`\nUser: ${user.name}, age ${user.age}`);
console.log(`Project: ${project.name}, ${project.weeks} weeks`);

// Key difference from Python dicts: you CAN'T access arbitrary keys.
// user.email;  // Error: Property 'email' does not exist

// This is massive — in Python, dict["missing_key"] throws KeyError at runtime.
// In TS, the compiler tells you immediately.

// =============================================================================
// 7. SPECIAL TYPES TO KNOW ABOUT
// =============================================================================

// `any` — opts out of type checking entirely. Like untyped Python.
// AVOID THIS. Our tsconfig has "no-explicit-any" as an error.
const dangerous: any = "anything goes";  // Legal but defeats the purpose

// `unknown` — the safe version of `any`. You must check the type before using it.
const mystery: unknown = "could be anything";
// mystery.toUpperCase();  // Error — TS doesn't know it's a string yet
if (typeof mystery === "string") {
  console.log(`\nMystery revealed: ${mystery.toUpperCase()}`); // Now it's safe
}

// `void` — for functions that don't return anything (like Python's -> None)
// `never` — for functions that NEVER return (they throw or loop forever)
// We'll cover these in the functions lesson.

// =============================================================================
// EXERCISE: Try these in your editor
// =============================================================================
// 1. Declare a const `favouriteLanguages` as an array of strings
const favouriteLanguages: string[] = ["TypeScript", "Python", "Rust"];
// 2. Declare a let `currentWeek` as a number, set to 1
let currentWeek: number = 1
// 3. Create an object `learner` with name (string), week (number), languages (string[])
const learner: {name: string; week: number; languages: string[]} = {
  name: "Morgan",
  week: 1,
  languages: ["Python", "TS"],
}
console.log(`\nName: ${learner.name}\nWeek: ${learner.week}\nLanguages: ${learner.languages}`)
// 4. Try assigning a wrong type to any of the above — read the error message
// currentWeek = "1"
// 5. Hover over inferred variables in VS Code to see what TS figured out

console.log("\n✓ Lesson 01 complete — variables and types");

// Lesson 01: Generics — functions that work with any type
// Run with: npx tsx lessons/05-generics-and-advanced-types/01-generics-basics.ts

// =============================================================================
// 1. WHY GENERICS?
// =============================================================================

// Python: TypeVar + Generic (typing module)
// TS:     <T> — first-class, much more ergonomic
//
// The problem generics solve: you want a function that works with ANY type
// but still preserves type information.
//
// Without generics, you'd reach for `any` or `unknown`:

function firstAny(arr: any[]): any {
  return arr[0];
}

const x = firstAny([1, 2, 3]);
// Hover `x` — it's `any`. We've thrown away the type! Now `x.toUpperCase()` compiles
// even though it'll crash at runtime. Generics fix this.

// =============================================================================
// 2. YOUR FIRST GENERIC FUNCTION
// =============================================================================

// Python: def first(arr: list[T]) -> T
// TS:     function first<T>(arr: T[]): T

function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

// The `<T>` after the function name declares a "type parameter" — a placeholder
// for whatever type the caller actually uses.

const n = first([1, 2, 3]); // T inferred as number — n: number | undefined
const s = first(["a", "b"]); // T inferred as string — s: string | undefined
const o = first([{ id: 1 }, { id: 2 }]); // T inferred as { id: number }

console.log(`first numbers: ${n}`);
console.log(`first strings: ${s}`);
console.log(`first object id: ${o?.id}`);

// Key point: TS INFERS T from the argument. You rarely write it explicitly.
// The type flows through: give me T[], I give you T. No casts, no `any`.

// =============================================================================
// 3. EXPLICIT TYPE ARGUMENTS (when inference isn't enough)
// =============================================================================

// Sometimes TS can't infer T, or infers a wider type than you want.
// You can pass it explicitly with `<Type>`:

function makeArray<T>(value: T, count: number): T[] {
  return Array.from({ length: count }, () => value);
}

// Inference works fine:
const zeros = makeArray(0, 3); // number[]
const hellos = makeArray("hi", 2); // string[]

// Explicit — useful when building an empty container:
const empty = makeArray<string>("", 0); // explicitly string[], not never[]

console.log(`\nzeros: ${zeros}, hellos: ${hellos}, empty length: ${empty.length}`);

// =============================================================================
// 4. MULTIPLE TYPE PARAMETERS
// =============================================================================

// Python: TypeVar("K"), TypeVar("V"), then Dict[K, V]
// TS:     <K, V>

function pair<K, V>(key: K, value: V): [K, V] {
  return [key, value];
}

const p1 = pair("age", 30); // [string, number]
const p2 = pair(42, true); // [number, boolean]

console.log(`\npair: ${JSON.stringify(p1)}, ${JSON.stringify(p2)}`);

// Real-world example — the Result type from lesson 3.3, now generic on BOTH:
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };
//                 ^^^^^^^^^ default type parameter: E falls back to Error
//                           if the caller doesn't provide one

function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

const r = ok({ id: "u1", name: "Morgan" }); // Result<{ id: string; name: string }>
if (r.ok) {
  console.log(`ok result: ${r.value.name}`);
}

// =============================================================================
// 5. GENERIC CONSTRAINTS (`extends`)
// =============================================================================

// Python: TypeVar("T", bound=SomeClass)
// TS:     <T extends SomeShape>
//
// Sometimes you don't want T to be LITERALLY anything — you need it to have
// certain properties. Use `extends` to constrain it.

// BAD — TS won't let you access .length because T might not have one:
//
//   function longest<T>(a: T, b: T): T {
//     return a.length > b.length ? a : b;  // Error: Property 'length' does not exist on type 'T'
//   }

interface HasLength {
  length: number;
}

function longest<T extends HasLength>(a: T, b: T): T {
  return a.length > b.length ? a : b;
}

// Now T must have a `length` property — strings, arrays, and any object with one:
console.log(`\nlongest string: ${longest("hi", "hello")}`);
console.log(`longest array: ${longest([1], [1, 2, 3])}`);
// longest(1, 2);  // Error — numbers don't have .length

// --- Constraining to a subset of keys ---
// Very common pattern: a function that picks a property.

function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { id: "u1", name: "Morgan", age: 30 };
const userName = getProperty(user, "name"); // typed as string
const userAge = getProperty(user, "age"); // typed as number
// getProperty(user, "email");  // Error: "email" is not a key of user

console.log(`\ngetProperty name: ${userName}, age: ${userAge}`);

// `keyof T` gives a union of the object's keys as literal types.
// More on keyof in lesson 4 of this week.

// =============================================================================
// 6. GENERICS IN ARROW FUNCTIONS
// =============================================================================

// Same rules, just different syntax. Note the comma after <T,> — in .tsx files
// TS would parse <T> as a JSX tag. The trailing comma disambiguates. In .ts
// files you don't need it, but many codebases use it for consistency.

const identity = <T,>(value: T): T => value;

const num = identity(42); // number
const str = identity("hi"); // string
console.log(`\nidentity: ${num}, ${str}`);

// =============================================================================
// 7. GENERICS WITH ARRAY METHODS (you already use these!)
// =============================================================================

// Every array method you've been using is generic under the hood.
// Hover over `.map` in VS Code — you'll see the full generic signature.

const numbers = [1, 2, 3];

// map<U>(callback: (item: T, index: number) => U): U[]
const doubled = numbers.map((n) => n * 2); // U inferred as number
const strings = numbers.map((n) => n.toString()); // U inferred as string

// filter<S extends T>(predicate: (item: T) => item is S): S[]  -- the type predicate form
const positive = [1, -2, 3, -4].filter((n): n is number => n > 0); // still number[]

console.log(`\nmap: ${doubled}, ${strings}`);
console.log(`filter: ${positive}`);

// =============================================================================
// 8. A REAL EXAMPLE — TYPED CACHE
// =============================================================================

// A cache that works for any value type, with no `any` anywhere.

function makeCache<T>() {
  const store = new Map<string, T>();
  return {
    set(key: string, value: T): void {
      store.set(key, value);
    },
    get(key: string): T | undefined {
      return store.get(key);
    },
    size(): number {
      return store.size;
    },
  };
}

const userCache = makeCache<{ id: string; name: string }>();
userCache.set("u1", { id: "u1", name: "Morgan" });
const cached = userCache.get("u1"); // typed as { id, name } | undefined
console.log(`\ncached user: ${cached?.name}, cache size: ${userCache.size()}`);

// The `<T>` on makeCache threads through to both set and get.
// Different caches for different types — no leakage.

const numberCache = makeCache<number>();
numberCache.set("answer", 42);
// numberCache.set("wrong", "not a number");  // Error — T is locked to number

// =============================================================================
// 9. COMMON MISTAKE: T DOESN'T MEAN "ANY"
// =============================================================================

// If you find yourself doing runtime checks INSIDE a generic, the generic is
// probably wrong. Generics are for "I don't care what T is, I'll pass it
// through unchanged." If you need to BRANCH on the type, use overloads or
// discriminated unions.

// BAD:
function tooClever<T>(value: T): string {
  if (typeof value === "string") return value.toUpperCase();
  if (typeof value === "number") return value.toFixed(2);
  return String(value);
}
// This "works" but the generic is a lie — we're not preserving T anywhere.
// Clearer as: function format(value: string | number): string { ... }

// GOOD — T flows through unchanged:
function tap<T>(value: T, log: (v: T) => void): T {
  log(value);
  return value;
}

const tapped = tap({ name: "Morgan" }, (v) => console.log(`\ntapping ${v.name}`));
console.log(`tapped: ${tapped.name}`);

// =============================================================================
// EXERCISES: Try these in your editor
// =============================================================================
// 1. Write a generic `last<T>(arr: T[]): T | undefined` that returns the last
//    element. Test it with numbers, strings, and an array of { id: string }.
//
// 2. Write `zip<A, B>(a: A[], b: B[]): [A, B][]` — like Python's zip for two
//    arrays. The result should stop at the shorter input's length.
//    Hint: use Math.min(a.length, b.length) in a for loop.
//
// 3. Write `groupBy<T, K extends string | number>(arr: T[], keyFn: (item: T) => K):
//    Record<K, T[]>` that groups items by the key returned from keyFn.
//    Test it with: groupBy([{age: 1}, {age: 2}, {age: 1}], x => x.age)
//
// 4. Write `pluck<T, K extends keyof T>(arr: T[], key: K): T[K][]` that returns
//    an array of the given property from each item.
//    Test it with: pluck([{name:"a"},{name:"b"}], "name")  // => ["a", "b"]
//
// 5. (Bonus) Write `memoize<A, R>(fn: (arg: A) => R): (arg: A) => R` that caches
//    results keyed by JSON.stringify(arg). Verify it only calls fn once per
//    unique input by logging from inside fn.

console.log("\n--- Lesson 01 complete --- generics basics");

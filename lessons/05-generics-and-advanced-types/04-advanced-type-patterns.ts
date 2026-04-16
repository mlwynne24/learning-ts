// Lesson 04: Advanced type patterns — keyof, typeof, mapped, conditional, template literals
// Run with: npx tsx lessons/05-generics-and-advanced-types/04-advanced-type-patterns.ts

// =============================================================================
// 1. THE MINDSET
// =============================================================================

// So far, types have described SHAPES. This lesson is about types that COMPUTE.
//
// TS's type system is a tiny pure-functional language that runs at compile time.
// You can take types as input and produce new types as output. That's how the
// utility types from lesson 3 are built.
//
// You won't write this stuff every day — but you'll READ it all the time in
// library types, and occasionally you'll need it for a tricky helper.

// =============================================================================
// 2. typeof — GO FROM A VALUE TO ITS TYPE
// =============================================================================

// There's a runtime `typeof` (returns "string", "number", etc.) — that's JS.
// Inside a TYPE context, `typeof` extracts the inferred type of a variable.

const config = {
  host: "localhost",
  port: 3000,
  features: ["auth", "logging"],
} as const;

type Config = typeof config;
// Hover — it's the FULL narrow type:
// { readonly host: "localhost"; readonly port: 3000; readonly features: readonly ["auth", "logging"] }
// Without `as const`, it'd be { host: string; port: number; features: string[] }.

const other: Config = config;
console.log(`typeof config: host=${other.host}, port=${other.port}`);

// This is HUGE for keeping types and runtime values in sync. Write the value
// once, derive the type from it.

// =============================================================================
// 3. keyof — GO FROM AN OBJECT TYPE TO ITS KEYS
// =============================================================================

// Python: a fixed Literal union you'd maintain by hand
// TS:     keyof automatically derives it

interface User {
  id: string;
  name: string;
  age: number;
}

type UserKey = keyof User; // "id" | "name" | "age"

function getField<T, K extends keyof T>(obj: T, key: K): T[K] {
  //                          ^^^^^^^^^^^       ^^^^^^
  //                      K is one of obj's keys   T[K] is "indexed access" — the
  //                                                type at that key
  return obj[key];
}

const u: User = { id: "u1", name: "Morgan", age: 30 };
const name: string = getField(u, "name"); // T[K] = string
const age: number = getField(u, "age"); // T[K] = number

console.log(`\nname: ${name}, age: ${age}`);

// Combined with typeof, keyof lets you derive keys of a runtime object:
const routes = {
  home: "/",
  profile: "/profile",
  settings: "/settings",
} as const;

type RouteName = keyof typeof routes; // "home" | "profile" | "settings"

function navigate(to: RouteName): void {
  console.log(`navigating to ${routes[to]}`);
}

navigate("home");
// navigate("about");  // Error — "about" is not a keyof typeof routes

// =============================================================================
// 4. INDEXED ACCESS TYPES — T[K]
// =============================================================================

// You saw T[K] above. It's the type AT a key. It's not limited to keyof —
// you can index by any key or union of keys.

type UserName = User["name"]; // string
type UserIdOrAge = User["id" | "age"]; // string | number

// Arrays work too — T[number] gives you the element type:
type Features = typeof config.features; // readonly ["auth", "logging"]
type FeatureName = (typeof config.features)[number]; // "auth" | "logging"

console.log(`\nindexed: UserName is a string, FeatureName is one of: auth, logging`);

// Real-world: typing the elements of an array from a const array.
const ROLES = ["admin", "editor", "viewer"] as const;
type Role = (typeof ROLES)[number]; // "admin" | "editor" | "viewer"

// Now ROLES and Role are in sync. Add "guest" to the array — the type widens
// automatically. No duplication.

// =============================================================================
// 5. MAPPED TYPES — TRANSFORM EVERY PROPERTY
// =============================================================================

// This is how Partial, Required, Readonly, Pick are built.
// Syntax: { [K in KeyUnion]: SomeType }

// Re-implementing Partial:
type MyPartial<T> = { [K in keyof T]?: T[K] };
// For every K in keyof T, make the field optional, type stays T[K].

// Re-implementing Readonly:
type MyReadonly<T> = { readonly [K in keyof T]: T[K] };

// Stripping readonly — the `-readonly` modifier:
type Mutable<T> = { -readonly [K in keyof T]: T[K] };

type FrozenUser = Readonly<User>;
type ThawedUser = Mutable<FrozenUser>; // readonly is gone

// A more useful one — wrap every field in a Promise:
type Asyncify<T> = { [K in keyof T]: Promise<T[K]> };

interface UserRepo {
  findById(id: string): User;
  save(user: User): void;
}

type AsyncUserRepo = Asyncify<UserRepo>;
// { findById: Promise<(id: string) => User>; save: Promise<(user: User) => void> }
// (Maybe not what we wanted — in practice you'd wrap return types only,
// not whole method types. That needs conditional types — see below.)

// Key rename with `as` — change the key while you map:
type Getters<T> = { [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K] };

type UserGetters = Getters<User>;
// { getId: () => string; getName: () => string; getAge: () => number }

const getters: UserGetters = {
  getId: () => "u1",
  getName: () => "Morgan",
  getAge: () => 30,
};

console.log(`\ngetters: ${getters.getName()}, age ${getters.getAge()}`);

// `Capitalize<string>` is a built-in string manipulation type — see section 7.

// =============================================================================
// 6. CONDITIONAL TYPES — TYPE-LEVEL IF/ELSE
// =============================================================================

// Syntax: T extends U ? X : Y
//         "if T is assignable to U, the type is X, otherwise Y"

type IsString<T> = T extends string ? true : false;

type A = IsString<"hello">; // true
type B = IsString<42>; // false

const a: A = true;
const b: B = false;
console.log(`\nconditional: A=${a}, B=${b}`);

// Why this is useful — typing things that DEPEND on input type.
// The canonical example:

type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
//                               ^^^^^^^^^^^^^^^^^
//                               "If T matches Promise<something>,
//                                name that something `U` and return it"

type X1 = UnwrapPromise<Promise<string>>; // string
type X2 = UnwrapPromise<number>; // number (unchanged)

// `infer` introduces a type variable IN THE MATCH. It only works inside a
// conditional type's `extends` clause. It's how Awaited, ReturnType, and
// Parameters are implemented.

// Re-implementing ReturnType:
type MyReturnType<F> = F extends (...args: never[]) => infer R ? R : never;

function greet(name: string): string {
  return `hi ${name}`;
}
type GreetReturn = MyReturnType<typeof greet>; // string

// Re-implementing Parameters:
type MyParameters<F> = F extends (...args: infer P) => unknown ? P : never;

type GreetParams = MyParameters<typeof greet>; // [name: string]

console.log(`\ngreet return and params derived via conditional types`);

// =============================================================================
// 7. DISTRIBUTIVE CONDITIONAL TYPES
// =============================================================================

// When you put a UNION into a conditional type, TS "distributes" over each
// member. This is subtle but powerful.

type NonStringify<T> = T extends string ? never : T;

type Result = NonStringify<string | number | boolean>;
// Evaluated as: (string extends string ? never : string)  // never
//             | (number extends string ? never : number)  // number
//             | (boolean extends string ? never : boolean) // boolean
// Simplified:  never | number | boolean = number | boolean

const r: Result = 42;
console.log(`\ndistributive: Result is number | boolean, r=${r}`);

// This is exactly how Exclude<T, U> is defined:
//   type Exclude<T, U> = T extends U ? never : T;
// When T is a union, distribution kicks in and filters member-by-member.

// To OPT OUT of distribution, wrap in a tuple:
type NoDistribute<T> = [T] extends [string] ? "yes" : "no";
type R1 = NoDistribute<string | number>; // "no" (treated as a whole)

// Most of the time you WANT distribution. Remember it exists for the rare
// case where you don't.

// =============================================================================
// 8. TEMPLATE LITERAL TYPES — TYPE-LEVEL STRINGS
// =============================================================================

// You can construct literal string types from other string types,
// just like template literals at runtime.

type Greeting = `Hello, ${string}`;
const g1: Greeting = "Hello, world";
// const g2: Greeting = "Hi there";  // Error

// Combine with unions — TS expands every combination:
type Lang = "en" | "fr" | "es";
type Scope = "auth" | "admin";
type Key = `${Lang}.${Scope}.ready`;
// "en.auth.ready" | "en.admin.ready" | "fr.auth.ready" | ... (6 total)

const k: Key = "en.auth.ready";
// const bad: Key = "de.auth.ready";  // Error

console.log(`\ntemplate literal: ${k}`);

// Built-in string helpers:
//   Uppercase<T>, Lowercase<T>, Capitalize<T>, Uncapitalize<T>

type Yell<S extends string> = `${Uppercase<S>}!`;
type Loud = Yell<"hello">; // "HELLO!"

// Realistic use: typed event names, CSS class names, redux-style action types.
type Event = `on${Capitalize<"click" | "hover" | "focus">}`;
// "onClick" | "onHover" | "onFocus"

// =============================================================================
// 9. PUTTING IT TOGETHER — TYPE-SAFE OBJECT PATH
// =============================================================================

// A classic demo: a `get` function that takes a dotted path and returns the
// correctly-typed value.

type Path<T> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object ? `${K}` | `${K}.${Path<T[K]>}` : `${K}`;
    }[keyof T & string]
  : never;

type PathValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? PathValue<T[K], Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never;

interface AppState {
  user: {
    profile: {
      name: string;
      age: number;
    };
    role: "admin" | "user";
  };
  version: string;
}

type AllPaths = Path<AppState>;
// "user" | "user.profile" | "user.profile.name" | "user.profile.age" | "user.role" | "version"

function getByPath<T, P extends Path<T>>(obj: T, path: P): PathValue<T, P> {
  return path
    .split(".")
    .reduce<unknown>((acc, key) => (acc as Record<string, unknown>)?.[key], obj) as PathValue<T, P>;
}

const state: AppState = {
  user: { profile: { name: "Morgan", age: 30 }, role: "admin" },
  version: "1.0",
};

const nm = getByPath(state, "user.profile.name"); // typed as string
const rl = getByPath(state, "user.role"); // typed as "admin" | "user"
// getByPath(state, "user.profile.email");  // Error — not a valid path

console.log(`\ntyped path: ${nm}, ${rl}`);

// This is the kind of thing libraries like zod, lodash-typed, or react-hook-form
// build internally. You don't have to write it — but you'll read it.

// =============================================================================
// 10. WHEN NOT TO GO DEEP
// =============================================================================

// This stuff is FUN but it's easy to over-engineer.
//
// Rule of thumb: every extra inference layer costs compile time and readability.
// If you find yourself four `infer`s deep, step back and ask:
//   - Is there a simpler type that's 95% as useful?
//   - Would a function with explicit return types be clearer than a type-level trick?
//   - Is this a LIBRARY API, or APP CODE? Libraries earn complex types; apps rarely do.
//
// Good heuristic: if you need to explain a type in a code review, simplify it.

// =============================================================================
// EXERCISES: Try these in your editor
// =============================================================================
// 1. Given `const LEVELS = ["debug", "info", "warn", "error"] as const`,
//    derive `type LogLevel = (typeof LEVELS)[number]`. Write a function
//    `log(level: LogLevel, msg: string)` and verify it rejects an unknown level.
//
// 2. Write `type Optional<T, K extends keyof T>` that makes ONLY the listed keys
//    optional, leaving the rest required.
//    Example: type UserDraft = Optional<User, "age">; // name and id required, age?
//    Hint: combine Omit and Partial: `Omit<T, K> & Partial<Pick<T, K>>`.
//
// 3. Write `type Getters<T> = { [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K] }`
//    and also write `type Setters<T>` that produces setXxx methods taking T[K] and returning void.
//    Combine them: `type Accessors<T> = Getters<T> & Setters<T>`.
//
// 4. Write a conditional type `Flatten<T>` that:
//    - If T is `Array<U>`, resolves to U
//    - If T is `Promise<U>`, resolves to U
//    - Otherwise resolves to T
//    Hint: nested conditional with `infer`.
//
// 5. (Bonus) Write `type EventMap<Prefix extends string>` that takes a prefix
//    and produces { [Prefix]Click; [Prefix]Hover; [Prefix]Focus } where each
//    value is () => void. Use template literal types and mapped types.
//    Example: EventMap<"on"> = { onClick: () => void; onHover: () => void; onFocus: () => void }

console.log("\n--- Lesson 04 complete --- advanced type patterns");
console.log("\n🎉 Week 5 complete! Next up: Vitest, testing, and the REST API project.");

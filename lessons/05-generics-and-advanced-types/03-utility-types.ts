// Lesson 03: Utility types — the built-in type toolbox
// Run with: npx tsx lessons/05-generics-and-advanced-types/03-utility-types.ts

// =============================================================================
// 1. WHAT ARE UTILITY TYPES?
// =============================================================================

// TS ships a set of built-in generic types that TRANSFORM other types.
// You've been using some implicitly (Array<T>, Promise<T>, Record<K, V>).
//
// These aren't magic — they're written in TypeScript itself using features
// we'll cover in lesson 4 (keyof, mapped types, conditional types).
// For now, just learn what each one DOES and when to reach for it.
//
// The whole point: derive new types from existing ones instead of duplicating.

interface User {
  id: string;
  name: string;
  email: string;
  age: number;
  password: string;
}

// We'll use this User type throughout the lesson.

// =============================================================================
// 2. Partial<T> — every property becomes optional
// =============================================================================

// Python: no direct equivalent (TypedDict with total=False, kind of)
// Use case: update functions, patch payloads, form drafts.

// Without Partial, you'd duplicate the interface:
//
//   interface UserUpdate { name?: string; email?: string; age?: number; ... }

// With Partial — one line:
type UserUpdate = Partial<User>;

function updateUser(id: string, updates: UserUpdate): void {
  console.log(`updating ${id} with:`, updates);
}

updateUser("u1", { name: "Morgan" }); // OK — only name
updateUser("u1", { email: "m@x.com", age: 31 }); // OK — subset
updateUser("u1", {}); // OK — no fields

// =============================================================================
// 3. Required<T> — the opposite of Partial
// =============================================================================

// Every property becomes required, even ones that were optional.

interface Config {
  host?: string;
  port?: number;
  debug?: boolean;
}

type StrictConfig = Required<Config>;
// Now: { host: string; port: number; debug: boolean }

const defaults: StrictConfig = {
  host: "localhost",
  port: 3000,
  debug: false,
};

console.log(`\nstrict config: ${JSON.stringify(defaults)}`);

// Common pattern: accept a Partial<Config> from the user, fill in with defaults,
// and return a fully-required Config.

// =============================================================================
// 4. Readonly<T> — freeze every property
// =============================================================================

// Same as the `readonly` modifier on an individual field, but applied to all.

type FrozenUser = Readonly<User>;

const frozen: FrozenUser = {
  id: "u1",
  name: "Morgan",
  email: "m@x.com",
  age: 30,
  password: "secret",
};

// frozen.name = "Alex";  // Error: Cannot assign to 'name' because it is read-only

console.log(`\nfrozen user: ${frozen.name}`);

// Note: Readonly is SHALLOW. Nested objects are still mutable.
// For deep freezing you need `DeepReadonly` — not built-in, but easy to write
// (we'll do this in lesson 4 exercises).

// =============================================================================
// 5. Pick<T, K> — keep only the listed keys
// =============================================================================

// Python: you'd manually duplicate. TS does it with a union of key literals.

type PublicUser = Pick<User, "id" | "name" | "email">;
// { id: string; name: string; email: string } — no age, no password

const safe: PublicUser = {
  id: "u1",
  name: "Morgan",
  email: "m@x.com",
};

console.log(`\npublic user: ${JSON.stringify(safe)}`);

// Common use: returning a "view" of an entity from an API without leaking
// sensitive fields.

// =============================================================================
// 6. Omit<T, K> — drop the listed keys
// =============================================================================

// The mirror of Pick. Usually the more ergonomic choice when you want to
// strip one or two properties from a big type.

type SafeUser = Omit<User, "password">;
// Everything from User except password

function toSafeUser(u: User): SafeUser {
  const { password: _pwd, ...rest } = u;
  return rest;
}

const fullUser: User = {
  id: "u1",
  name: "Morgan",
  email: "m@x.com",
  age: 30,
  password: "secret",
};

const publicView = toSafeUser(fullUser);
console.log(`\nsafe view: ${JSON.stringify(publicView)}`);
// publicView.password;  // Error — not a key of SafeUser

// Rule of thumb: Pick when you want FEW fields, Omit when you want MOST.

// =============================================================================
// 7. Record<K, V> — an object with known keys and uniform values
// =============================================================================

// Python: Dict[K, V]
// TS:     Record<K, V>

// Fixed set of keys, all with the same value type:
type Roles = Record<"admin" | "editor" | "viewer", string[]>;

const permissions: Roles = {
  admin: ["*"],
  editor: ["read", "write"],
  viewer: ["read"],
};

console.log(`\npermissions: ${JSON.stringify(permissions)}`);

// Open-ended — any string key:
type Scores = Record<string, number>;

const scores: Scores = {
  Morgan: 100,
  Alex: 85,
};
scores["Sam"] = 92; // allowed — any string key works

// Record<string, T> is the modern way to write { [key: string]: T }.
// Both work; Record reads more clearly.

// =============================================================================
// 8. Exclude<T, U> and Extract<T, U> — union math
// =============================================================================

// These operate on UNIONS, not object types.

type Status = "pending" | "active" | "done" | "cancelled";

type InProgress = Exclude<Status, "done" | "cancelled">; // "pending" | "active"
type Terminal = Extract<Status, "done" | "cancelled">; // "done" | "cancelled"

const running: InProgress = "active";
const finished: Terminal = "done";

console.log(`\nrunning: ${running}, finished: ${finished}`);

// Think of them as set operations:
//   Exclude<T, U> = T − U  (remove from T anything in U)
//   Extract<T, U> = T ∩ U  (keep only what's also in U)

// =============================================================================
// 9. NonNullable<T> — strip null and undefined
// =============================================================================

// A common specialisation — equivalent to Exclude<T, null | undefined>.

type MaybeName = string | null | undefined;
type DefiniteName = NonNullable<MaybeName>; // string

function assertName(name: MaybeName): DefiniteName {
  if (name == null) throw new Error("name required");
  return name;
}

console.log(`\nassertName: ${assertName("Morgan")}`);

// =============================================================================
// 10. ReturnType<F> and Parameters<F> — inspect function types
// =============================================================================

// Extract pieces of a function type WITHOUT rewriting them.

function createUser(name: string, age: number, email: string): User {
  return { id: "u1", name, age, email, password: "xxx" };
}

type CreateUserReturn = ReturnType<typeof createUser>; // User
type CreateUserArgs = Parameters<typeof createUser>; // [name: string, age: number, email: string]

const args: CreateUserArgs = ["Morgan", 30, "m@x.com"];
const created: CreateUserReturn = createUser(...args);

console.log(`\ncreated: ${created.name}`);

// `typeof functionName` gives you the function's TYPE (covered in lesson 4).
// Then ReturnType and Parameters pick it apart.
//
// Use case: wrapping a function in a logger, retry, or cache — your wrapper
// should have the SAME signature, derived automatically.

// Note the constraint `(...args: never[]) => unknown` — using `never[]` for
// the args lets ANY function signature flow through, because `never` is
// assignable to everything. `unknown[]` would reject functions with specific
// arg types (like createUser's (string, number, string)).
function withLog<F extends (...args: never[]) => unknown>(
  fn: F,
): (...args: Parameters<F>) => ReturnType<F> {
  return (...args) => {
    console.log(`calling ${fn.name} with`, args);
    return (fn as (...a: Parameters<F>) => ReturnType<F>)(...args);
  };
}

const loggedCreate = withLog(createUser);
const user = loggedCreate("Alex", 28, "a@x.com");
console.log(`logged user: ${user.name}`);

// =============================================================================
// 11. Awaited<T> — unwrap a Promise
// =============================================================================

// If T is Promise<U>, Awaited<T> is U. Handles nested Promises too (unlikely
// to come up, but Awaited<Promise<Promise<string>>> is still string).

async function fetchUser(): Promise<User> {
  return createUser("Sam", 25, "s@x.com");
}

type FetchUserReturn = ReturnType<typeof fetchUser>; // Promise<User>
type FetchUserResolved = Awaited<FetchUserReturn>; // User

// Common idiom: derive the resolved type of any async function
type UserData = Awaited<ReturnType<typeof fetchUser>>;

const data: UserData = await fetchUser();
console.log(`\nfetched: ${data.name}`);

// =============================================================================
// 12. COMPOSING UTILITY TYPES
// =============================================================================

// Utility types chain freely. You can layer them to describe precise shapes.

// "A user update where the fields that ARE provided can't be undefined"
type StrictUpdate = Required<Partial<User>>; // trivially equal to User, shown for shape

// "A draft user — everything optional, nothing required, for a form in progress"
type UserDraft = Partial<Omit<User, "id">>;
// { name?: string; email?: string; age?: number; password?: string }

const draft: UserDraft = { name: "in progress" };
console.log(`\ndraft: ${JSON.stringify(draft)}`);

// "A read-only view of a public user"
type PublicReadonly = Readonly<Omit<User, "password">>;

// Real-world: you'll often see these stacked in API types.
// Don't over-engineer — sometimes writing the interface directly is clearer.

// =============================================================================
// 13. QUICK REFERENCE TABLE
// =============================================================================

const reference: [string, string, string][] = [
  ["Partial<T>", "every property optional", "update payloads, drafts"],
  ["Required<T>", "every property required", "fill-in-defaults results"],
  ["Readonly<T>", "every property readonly", "frozen config, immutable views"],
  ["Pick<T, K>", "keep only keys K", "API views, narrow subsets"],
  ["Omit<T, K>", "drop keys K", "strip sensitive fields"],
  ["Record<K, V>", "object with K → V", "lookup tables, dicts"],
  ["Exclude<T, U>", "T minus U (unions)", "remove variants from a union"],
  ["Extract<T, U>", "T intersect U (unions)", "narrow a union"],
  ["NonNullable<T>", "strip null/undefined", "after a null check"],
  ["ReturnType<F>", "function's return", "typing wrappers"],
  ["Parameters<F>", "function's args tuple", "forwarding args"],
  ["Awaited<T>", "unwrap Promise<T>", "typing async results"],
];

console.log("\n=== Utility types reference ===");
for (const [name, does, when] of reference) {
  console.log(`  ${name.padEnd(16)} ${does.padEnd(28)} → ${when}`);
}

// =============================================================================
// EXERCISES: Try these in your editor
// =============================================================================
// 1. Given the User interface from this lesson, define:
//    - A type `UserCredentials` with only email and password
//    - A type `UserPreview` with only id and name
//    - A type `UserWithoutId` that's everything except id (useful for
//      "create" operations where the DB assigns the id)
//    Use Pick and Omit.
type UserCredentials = Pick<User, "email" | "password">;
const userCredentials: UserCredentials = { email: "m@x.com", password: "xxx" };
type UserPreview = Pick<User, "id" | "name">;
const testUserPreview: UserPreview = { id: "001", name: "morgan" };
type UserWithoutId = Omit<User, "id">;
const { id: _id, ...rest } = fullUser;
const testUserWithoutId: UserWithoutId = rest;
//
// 2. Define `type Settings = { theme?: "light" | "dark"; fontSize?: number; locale?: string }`.
//    Write a function `applyDefaults(s: Partial<Settings>): Required<Settings>` that
//    fills in any missing fields with defaults. Use the ?? operator.
type Settings = { theme?: "light" | "dark"; fontSize?: number; locale?: string };

function applyDefaults(s: Partial<Settings>): Required<Settings> {
  return {
    theme: s.theme ?? "light",
    fontSize: s.fontSize ?? 12,
    locale: s.locale ?? "en",
  };
}

const userDefinedSettings: Settings = { locale: "en" };
const userFullSettings: Settings = applyDefaults(userDefinedSettings);
console.log(userFullSettings);
//
// 3. Given the union `type Action = "create" | "read" | "update" | "delete"`:
//    - Derive `type ReadOnlyAction = Extract<Action, "read">` — verify it's just "read"
//    - Derive `type MutatingAction = Exclude<Action, "read">`
//    - Write a function `isMutating(a: Action): a is MutatingAction` using a type predicate.
type Action = "create" | "read" | "update" | "delete";
type ReadOnlyAction = Extract<Action, "read">;
type MutatingAction = Exclude<Action, "read">;

function isMutating(a: Action): a is MutatingAction {
  return a !== "read";
}

console.log(isMutating("update"));
console.log(isMutating("read"));
//
// 4. Write a generic `Wrapped<T>` type alias: if T is a Promise, use Awaited<T>;
//    otherwise just T. For now, do it by hand using Awaited — in lesson 4 you'll
//    learn conditional types and can express this generically.
type Wrapped<T> = Awaited<T>;
//
// 5. (Bonus) Write `function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>`.
//    This is your own runtime version of Pick. Test it:
//      pick({ a: 1, b: 2, c: 3 }, ["a", "c"])  // => { a: 1, c: 3 }
//    Make sure the return type is narrowed — not just Record<string, unknown>.
function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const k of keys) {
    const v = obj[k];
    if (k !== undefined) {
      result[k] = obj[k];
    }
  }
  return result;
}

console.log("\n--- Lesson 03 complete --- utility types");

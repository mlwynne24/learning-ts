// Lesson 04: Unions, Literals & Narrowing
// Run with: npx ts-node --esm lessons/01-fundamentals/04-unions-and-narrowing.ts

// =============================================================================
// 1. UNION TYPES
// =============================================================================

// Python: Union[str, int] or str | int (3.10+)
// TS:     string | number — same syntax as modern Python!

let id: string | number;
id = "abc-123";
id = 42;
// id = true;  // Error: Type 'boolean' is not assignable to type 'string | number'

// Unions are everywhere in real TS code:
function formatId(id: string | number): string {
  // But here's the catch — you can only use methods common to BOTH types:
  // id.toUpperCase();  // Error! number doesn't have toUpperCase
  // id.toFixed();      // Error! string doesn't have toFixed

  // You MUST narrow the type first (see section 3)
  return String(id);
}

console.log(formatId("abc"));
console.log(formatId(42));

// =============================================================================
// 2. LITERAL TYPES
// =============================================================================

// Remember from lesson 01: `const direction = "north"` has type "north", not string.
// You can use specific values AS types. No Python equivalent.
type Direction = "north" | "south" | "east" | "west";

let heading: Direction = "north";
heading = "east";
// heading = "up";  // Error: Type '"up"' is not assignable to type 'Direction'

// This is like Python's Literal["north", "south", "east", "west"] — but more natural.

// Works with numbers too:
type DiceRoll = 1 | 2 | 3 | 4 | 5 | 6;
const roll: DiceRoll = 4;
// const badRoll: DiceRoll = 7;  // Error!

// And booleans (though less common):
type Truthy = true;

console.log(`\nHeading: ${heading}, Roll: ${roll}`);

// Real-world use: API status codes, state machines, config options
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
type LogLevel = "debug" | "info" | "warn" | "error";

function logAtLevel(level: LogLevel, message: string): void {
  console.log(`[${level.toUpperCase()}] ${message}`);
}

logAtLevel("info", "Server started");
// logAtLevel("trace", "...");  // Error: not in the union

// =============================================================================
// 3. TYPE NARROWING (the killer feature)
// =============================================================================

// TypeScript tracks the type of a variable as your code flows through
// conditions. This is called "narrowing" — and it's what makes unions usable.

// --- typeof guard ---
// Python: isinstance(x, str)
// TS:     typeof x === "string"

function describe(value: string | number): string {
  if (typeof value === "string") {
    // TS KNOWS value is a string here — autocomplete shows string methods
    return `String of length ${value.length}: "${value.toUpperCase()}"`;
  }
  // TS KNOWS value is a number here (only option left)
  return `Number: ${value.toFixed(2)}`;
}

console.log(`\n${describe("hello")}`);
console.log(describe(3.14159));

// typeof works for: "string", "number", "boolean", "undefined", "object", "function"
// Note: typeof null === "object" — a famous JS bug that's been there since 1995.
if (typeof null === "object") {
  console.log("Here is the bug!")
}

// --- Truthiness narrowing ---
// Checks for null/undefined — very common pattern

function greetUser(name: string | null | undefined): string {
  if (!name) {
    // name is null, undefined, or "" (empty string)
    return "Hello, stranger!";
  }
  // name is string here (and non-empty)
  return `Hello, ${name}!`;
}

console.log(`\n${greetUser("Morgan")}`);
console.log(greetUser(null));
console.log(greetUser(undefined));

// --- Equality narrowing ---

function compare(a: string | number, b: string | boolean): void {
  if (a === b) {
    // The ONLY overlap between (string | number) and (string | boolean) is string
    // So TS knows both a and b are strings here!
    console.log(`Both strings: ${a.toUpperCase()} === ${b.toUpperCase()}`);
  }
}

compare("hello", "hello");

// --- `in` operator narrowing ---
// Python: hasattr(obj, "attr") or "key" in dict
// TS:     "property" in object

interface Fish {
  swim: () => void;
}

interface Bird {
  fly: () => void;
}

function move(animal: Fish | Bird): void {
  if ("swim" in animal) {
    animal.swim(); // TS knows it's Fish
  } else {
    animal.fly(); // TS knows it's Bird
  }
}

move({ swim: () => console.log("\nSwimming!") });
move({ fly: () => console.log("Flying!") });

// --- instanceof narrowing ---
// Same as Python's isinstance()

function formatDate(input: string | Date): string {
  if (input instanceof Date) {
    return input.toISOString(); // TS knows it's a Date
  }
  return input; // TS knows it's a string
}

console.log(`\nDate: ${formatDate(new Date())}`);
console.log(`String: ${formatDate("2026-03-30")}`);

// =============================================================================
// 4. DISCRIMINATED UNIONS (the TS design pattern)
// =============================================================================

// This is THE most important pattern in TypeScript. No Python equivalent.
// (Python's closest: tagged unions with Literal + Union, but clunky.)

// The idea: give each variant a common property with a literal type.
// TS can then narrow based on that "discriminant" property.

interface Circle {
  kind: "circle"; // <-- the discriminant
  radius: number;
}

interface Rectangle {
  kind: "rectangle"; // <-- the discriminant
  width: number;
  height: number;
}

interface Triangle {
  kind: "triangle";
  base: number;
  height: number;
}

type Shape = Circle | Rectangle | Triangle;

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      // TS knows shape is Circle here — shape.radius is available
      return Math.PI * shape.radius ** 2;
    case "rectangle":
      // TS knows shape is Rectangle — shape.width and shape.height available
      return shape.width * shape.height;
    case "triangle":
      return (shape.base * shape.height) / 2;
  }
}

console.log(`\nCircle area: ${area({ kind: "circle", radius: 5 }).toFixed(2)}`);
console.log(`Rectangle area: ${area({ kind: "rectangle", width: 4, height: 6 })}`);
console.log(`Triangle area: ${area({ kind: "triangle", base: 3, height: 8 })}`);

// Why is this so powerful?
// 1. TS exhaustively checks that you handle all cases
// 2. Each branch gets full type information
// 3. Adding a new shape variant causes compile errors everywhere you forgot to handle it

// Real-world examples: API responses, Redux actions, state machines, AST nodes

// --- Exhaustiveness checking ---
// If you add a new shape but forget to handle it, TS can catch that:

function areaStrict(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "rectangle":
      return shape.width * shape.height;
    case "triangle":
      return (shape.base * shape.height) / 2;
    default: {
      // This line ensures ALL cases are handled.
      // If you add a new Shape variant but forget its case, this line errors.
      const _exhaustive: never = shape;
      return _exhaustive;
    }
  }
}

interface Pentagon {
  kind: "pentagon";
  side: number;
};

// Try it: add `interface Pentagon { kind: "pentagon"; side: number; }` to
// the Shape union. The `_exhaustive` line will immediately error — forcing
// you to handle the new case. This is compile-time safety that Python can't match.

// =============================================================================
// 5. TYPE PREDICATES (custom type guards)
// =============================================================================

// Sometimes typeof and instanceof aren't enough. You can write your own.
// Python: TypeGuard (from typing, 3.10+)

interface Cat {
  meow: () => void;
  purr: () => void;
}

interface Dog {
  bark: () => void;
  fetch: () => void;
}

// `pet is Cat` is a TYPE PREDICATE — it tells TS what the function is checking
function isCat(pet: Cat | Dog): pet is Cat {
  return "meow" in pet;
}

function interact(pet: Cat | Dog): void {
  if (isCat(pet)) {
    pet.purr(); // TS knows it's Cat
  } else {
    pet.fetch(); // TS knows it's Dog
  }
}

interact({
  meow: () => console.log("\nMeow!"),
  purr: () => console.log("Purrrr"),
});

interact({
  bark: () => console.log("Woof!"),
  fetch: () => console.log("Fetching!"),
});

// =============================================================================
// 6. NULLISH COALESCING & OPTIONAL CHAINING
// =============================================================================

// You used `??` in lesson 02 — let's cover it properly.

// --- ?? (nullish coalescing) ---
// Python: value if value is not None else default
// TS:     value ?? default  (only for null/undefined, NOT for 0 or "")

const input: string | null = null;
const displayName = input ?? "Anonymous";
console.log(`\nName: ${displayName}`);

// Compare with || (logical OR) — which also catches 0, "", false:
const count: number | null = 0;
console.log(`?? preserves 0: ${count ?? 10}`); // 0 (correct!)
console.log(`|| loses 0: ${count || 10}`);      // 10 (probably a bug)

// --- ?. (optional chaining) ---
// Python: no equivalent (you'd need try/except or getattr)
// TS:     obj?.prop — returns undefined if obj is null/undefined

interface UserSettings {
  theme?: {
    primaryColor?: {
      hue: string;
      shadow: string;
    };
    fontSize?: number;
  };
}

const settings: UserSettings = {};
const color = settings.theme?.primaryColor?.hue ?? "blue";
console.log(`Theme color: ${color}`);

// You can chain deeply:
// settings.theme?.colors?.primary?.hex ?? "default"

// Also works with function calls:
// callback?.()  — only calls if callback isn't null/undefined

// And array access:
// arr?.[0]  — only accesses if arr isn't null/undefined

const arr: unknown[] = [];
console.log(arr?.[0])

// =============================================================================
// 7. NON-NULL ASSERTION (use sparingly!)
// =============================================================================

// When YOU know a value isn't null but TS doesn't, use `!`

let element: string | null // = "definitely here";
const length = element!.length; // The `!` tells TS "trust me, it's not null"

console.log(`\nLength: ${length}`);

// WARNING: this is an escape hatch. If you're wrong, you get a runtime error.
// Prefer narrowing (if checks) over `!`. Use `!` only when you truly know better.

// =============================================================================
// EXERCISES: Try these in your editor
// =============================================================================
// 1. Define a type `Result` as a discriminated union with two variants:
//    - { success: true, data: string }
//    - { success: false, error: string }
//    Write a function `handleResult` that takes a Result and returns
//    the data string on success or "ERROR: <message>" on failure.
//
interface SuccessfulResult {
  success: true;
  data: string;
};

interface UnsuccessfulResult {
  success: false;
  error: string;
};

type Result = SuccessfulResult | UnsuccessfulResult

const handleResult = (result: Result) => {
  if (result.success) {
    return result.data
  } else {
    return `ERROR: ${result.error}`
  }
}

// 2. Write a function `stringify` that takes string | number | boolean | null
//    and returns a string representation. Use typeof narrowing to handle
//    each case differently (e.g., booleans become "yes"/"no", null becomes "N/A").
//
function stringify (x: string | number | boolean | null) {
  if (typeof x === "string") {
    return x
  } else if (typeof x === "number") {
    return x.toString()
  } else if (typeof x === "boolean") {
    if (x === true) {
      return "yes"
    } else {
      return "no"
    }
  } else if (x === null) {
    return "N/A"
  }
}

// 3. Define interfaces `EmailNotification` and `SmsNotification`, both with
//    a `type` discriminant ("email" | "sms"). EmailNotification has `subject`
//    and `body`. SmsNotification has `phoneNumber` and `message`.
//    Write a function `send` that takes their union and logs appropriately.
//
interface EmailNotification {
  type: "email";
  subject: string;
  body: string;
};

interface SmsNotification {
  type: "sms";
  phone_number: string;
  message: string;
};

type Notification = EmailNotification | SmsNotification;

function send (notification: Notification): undefined {
  switch (notification.type) {
    case "email":
      console.log(`Subject: ${notification.subject}, Body: ${notification.body}`);
      break;
    case "sms":
      console.log(`Phone number: ${notification.phone_number}, Message: ${notification.message}`);
      break;
  };
};

// 4. (Bonus) Write a type predicate `isNonNull` that takes a value of type
//    T | null | undefined and returns `value is T`. Use it to filter an
//    array: [1, null, 2, undefined, 3].filter(isNonNull)
//    Hint: the return type is `value is T` where T is a generic — we haven't
//    covered generics yet, so here's the signature:
//    function isNonNull<T>(value: T | null | undefined): value is T
function isNonNull<T>(v: T | null | undefined): v is T {
  return v !== null && v !== undefined;
}

console.log([1, null, 2, undefined, 3].map(isNonNull))

console.log("\n--- Lesson 04 complete --- unions, literals & narrowing");

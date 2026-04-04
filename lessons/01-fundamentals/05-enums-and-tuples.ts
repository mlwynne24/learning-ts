// Lesson 05: Enums & Tuples
// Run with: npx ts-node --esm lessons/01-fundamentals/05-enums-and-tuples.ts

// =============================================================================
// 1. ENUMS — named constants
// =============================================================================

// Python: class Color(Enum): RED = "red" ...
// TS:     enum Color { Red = "red", ... }

// --- String enums (preferred in most codebases) ---

enum Direction {
  Up = "UP",
  Down = "DOWN",
  Left = "LEFT",
  Right = "RIGHT",
}

let playerDirection: Direction = Direction.Up;
playerDirection = Direction.Left;
// playerDirection = "UP";  // Error! Can't assign a raw string — must use the enum

console.log(`Direction: ${playerDirection}`); // "LEFT"

// Why use an enum instead of a union type like "UP" | "DOWN" | "LEFT" | "RIGHT"?
// - Enums group related constants under a namespace (Direction.Up)
// - IDE autocomplete shows all options
// - Refactoring: rename the value in one place
// BUT: many TS devs prefer union literals. Both are valid.

// --- Numeric enums ---

enum HttpStatus {
  Ok = 200,
  Created = 201,
  BadRequest = 400,
  NotFound = 404,
  InternalServerError = 500,
}

function describeStatus(status: HttpStatus): string {
  switch (status) {
    case HttpStatus.Ok:
      return "Success";
    case HttpStatus.NotFound:
      return "Not found";
    case HttpStatus.InternalServerError:
      return "Server error";
    default:
      return `Status ${status}`;
  }
}

console.log(`\n200 = ${describeStatus(HttpStatus.Ok)}`);
console.log(`404 = ${describeStatus(HttpStatus.NotFound)}`);

// --- Auto-incrementing numeric enums ---
// If you don't assign values, they start at 0 and increment:

enum Priority {
  Low,    // 0
  Medium, // 1
  High,   // 2
  Critical, // 3
}

console.log(`\nHigh priority = ${Priority.High}`); // 2

// Warning: numeric enums allow reverse mapping, which can be confusing:
console.log(`Priority[2] = ${Priority[2]}`); // "High" — string enums don't do this

// =============================================================================
// 2. const ENUMS (compile-time only)
// =============================================================================

// Regular enums generate JavaScript code (an object at runtime).
// `const enum` is inlined at compile time — no runtime object.

const enum Feature {
  DarkMode = "DARK_MODE",
  Notifications = "NOTIFICATIONS",
  BetaAccess = "BETA_ACCESS",
}

const enabledFeature = Feature.DarkMode;
console.log(`\nFeature: ${enabledFeature}`);
// In the compiled JS, this becomes: const enabledFeature = "DARK_MODE"
// No Feature object exists at runtime — it's fully erased.

// Use const enum when you just want named constants with zero runtime cost.

// =============================================================================
// 3. ENUMS vs UNION LITERALS — when to use which
// =============================================================================

// Union literal approach (many TS devs prefer this):
type LogLevel = "debug" | "info" | "warn" | "error";

// Enum approach:
enum LogLevelEnum {
  Debug = "debug",
  Info = "info",
  Warn = "warn",
  Error = "error",
}

// Union pros: simpler, no generated code, works well with string APIs
// Enum pros: namespaced, IDE discoverability, good for large sets of constants
// Rule of thumb: unions for < 5 values, enums when you want a namespace

// =============================================================================
// 4. TUPLES — fixed-length, typed arrays
// =============================================================================

// Python: tuple[str, int] (or Tuple[str, int] pre-3.9)
// TS:     [string, number]

const person: [string, number] = ["Morgan", 30];
const name = person[0]; // type: string
const age = person[1];  // type: number
// person[2];           // Error: Tuple type has no element at index '2'

console.log(`\nTuple: ${name}, age ${age}`);

// Tuples know the type at each position — arrays don't:
const arr: string[] = ["Morgan", "Alex"];
const first = arr[0]; // type: string (same for any index)

// --- Destructuring tuples (very common) ---
// Python: name, age = ("Morgan", 30)
// TS:     same!

const [userName, userAge] = person;
console.log(`Destructured: ${userName}, ${userAge}`);

// --- Where you'll see tuples in real code ---

// 1. Coordinate pairs
type Point = [number, number];
const origin: Point = [0, 0];
const target: Point = [10, 20];
console.log(`\nOrigin: (${origin[0]}, ${origin[1]})`);

// 2. Key-value pairs
type Entry = [string, number];
const entries: Entry[] = [
  ["apples", 3],
  ["bananas", 5],
];
console.log(`Entries: ${entries.map(([k, v]) => `${k}=${v}`).join(", ")}`);

// 3. Function returns (like Python's multiple return values)
function divide(a: number, b: number): [number, number] {
  return [Math.floor(a / b), a % b]; // [quotient, remainder]
}

const [quotient, remainder] = divide(17, 5);
console.log(`17 / 5 = ${quotient} remainder ${remainder}`);

// 4. React's useState pattern (you'll see this everywhere):
// const [count, setCount] = useState(0);  // returns [number, (n: number) => void]

// =============================================================================
// 5. LABELED TUPLES (documentation only)
// =============================================================================

// You can add labels for clarity — they don't affect runtime, just readability:

type Range = [start: number, end: number];
type ApiResult = [success: boolean, data: string, statusCode: number];

const range: Range = [0, 100];
const result: ApiResult = [true, '{"users": []}', 200];

console.log(`\nRange: ${range[0]} to ${range[1]}`);

// =============================================================================
// 6. OPTIONAL AND REST ELEMENTS IN TUPLES
// =============================================================================

// Optional elements (must be at the end):
type FlexPoint = [number, number, number?]; // 2D or 3D

const point2d: FlexPoint = [1, 2];
const point3d: FlexPoint = [1, 2, 3];

console.log(`\n2D: ${point2d}, 3D: ${point3d}`);

// Rest elements — variable length with typed prefix:
type StringAndNumbers = [string, ...number[]];

const data: StringAndNumbers = ["scores", 95, 87, 72, 68];
const [label, ...values] = data;
console.log(`${label}: ${values.join(", ")}`);

// =============================================================================
// 7. READONLY TUPLES AND ARRAYS
// =============================================================================

// Python: tuple is immutable by default. JS arrays/tuples are always mutable.
// TS: `readonly` prevents mutation at compile time.

const fixed: readonly [string, number] = ["Morgan", 30];
// fixed[0] = "Alex";  // Error: Cannot assign to '0' because it is a read-only property
// fixed.push("extra"); // Error: Property 'push' does not exist on type 'readonly [string, number]'

// Works on arrays too:
const frozenList: readonly string[] = ["a", "b", "c"];
// frozenList.push("d");  // Error!
// frozenList[0] = "z";   // Error!

console.log(`\nReadonly tuple: ${fixed}`);
console.log(`Readonly array: ${frozenList}`);

// Shorthand with `as const` — makes everything readonly AND narrows to literal types:
const config = {
  host: "localhost",
  port: 3000,
  features: ["auth", "logging"],
} as const;

// config.host = "0.0.0.0";          // Error: readonly
// config.features.push("metrics");   // Error: readonly
// Type of config.host is "localhost" (literal), not string
// Type of config.features is readonly ["auth", "logging"], not string[]

console.log(`Config: ${config.host}:${config.port}`);

// `as const` is incredibly useful — you'll see it a lot in production code.

// =============================================================================
// EXERCISES: Try these in your editor
// =============================================================================
// 1. Define a string enum `Status` with values: Pending, InProgress, Done, Cancelled.
//    Write a function `isTerminal` that returns true for Done and Cancelled.
//
enum Status {
  Pending = "pending",
  InProgress = "in_progress",
  Done = "done",
  Cancelled = "cancelled",
};

function isTerminal (status: Status): boolean | undefined {
  switch (status) {
    case Status.Done || Status.Cancelled:
      return true
  }
}

console.log(`Pending: ${isTerminal(Status.Pending)}`)
console.log(`Done: ${isTerminal(Status.Done)}`)

// 2. Define a tuple type `CsvRow` = [id: number, name: string, score: number].
//    Create an array of CsvRow and write a function that finds the row with
//    the highest score, returning the whole tuple.
//
type CsvRow = [id: number, name: string, score: number];

let array: CsvRow[] = [[1, "Morgan", 5], [2, "Gethin", 7], [3, "May", 20]];

const highestScorer = (players: CsvRow[]): CsvRow => {
  let scores: number[] = players.map((v, i, arr) => v[2]);
  const max_score: number = Math.max(...scores);
  const index: number = scores.indexOf(max_score)
  return players[index]
}

const [_id, _name, _score] = highestScorer(array)

console.log(`Highest scorer - Name: ${_name}, Score: ${_score}`)

// 3. Write a function `minMax` that takes a number[] and returns a
//    [min: number, max: number] tuple. Destructure the result.
//
const minMax = (arr: number[]): [min: number, max: number] => {
  return [Math.min(...arr), Math.max(...arr)]
}

const [min, max] = minMax([5, 23, 643, 23, 12])
console.log(`${min}, ${max}`)

// 4. (Bonus) Use `as const` to define a config object with nested properties.
//    Try to modify a property — observe the error. Then write a type that
//    extracts just the literal type of one of its properties using `typeof`.
//    Example: typeof config.host → "localhost" (not string)
//
const localConfig = {
  host: "localhost",
  port: 3000,
  features: ["auth", "logging"],
} as const;

type Host = typeof localConfig.host
type Port = typeof localConfig.port
type Features = typeof localConfig.features

type Config = typeof localConfig
// The key insight: as const narrows every value to its literal type and makes everything readonly.
//  Then typeof lets you pull those literal types out to use as type annotations elsewhere — so    
// typeof localConfig.host is "localhost", not string. This is useful when you want to derive types
//  from runtime values instead of duplicating them.

console.log("\n--- Lesson 05 complete --- enums & tuples");

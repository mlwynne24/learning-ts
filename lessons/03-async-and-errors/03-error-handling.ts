// Lesson 03: Error handling
// Run with: npx tsx lessons/03-async-and-errors/03-error-handling.ts

// =============================================================================
// 1. THROWING AND CATCHING
// =============================================================================

// Python: raise / try / except
// TS:     throw / try / catch
//
// You can technically `throw` ANY value in JS — a string, a number, anything.
// You should ALWAYS throw an `Error` (or subclass). Tools, stack traces, and
// type narrowing all assume that's what you're doing.

function parsePort(input: string): number {
  const n = Number(input);
  if (Number.isNaN(n)) {
    throw new Error(`Not a number: "${input}"`);
  }
  if (n < 1 || n > 65535) {
    throw new Error(`Port out of range: ${n}`);
  }
  return n;
}

try {
  console.log(`Port: ${parsePort("3000")}`);
  console.log(`Port: ${parsePort("oops")}`);
} catch (err) {
  // We'll discuss what `err` is typed as in section 3.
  if (err instanceof Error) {
    console.log(`Caught: ${err.message}`);
  }
}

// =============================================================================
// 2. THE Error CLASS
// =============================================================================

// Every Error has at least:
//   - message: string  — human-readable description
//   - name: string     — class name (defaults to "Error")
//   - stack: string    — stack trace (added by V8)
//   - cause?: unknown  — the underlying error (added in ES2022)

const err = new Error("something broke");
console.log(`\nname: ${err.name}`);
console.log(`message: ${err.message}`);
console.log(`stack (truncated):\n${err.stack?.split("\n").slice(0, 2).join("\n")}`);

// Built-in subclasses you'll see:
//   TypeError      — wrong type used
//   RangeError     — value out of range
//   SyntaxError    — JSON.parse failure, etc.
//   ReferenceError — using an undefined variable

// =============================================================================
// 3. CATCH BLOCKS AND `unknown`
// =============================================================================

// Python: `except Exception as e` — e is always an Exception
// TS:     `catch (err)` — err is `unknown` by default in strict mode
//
// Why unknown? Because anyone can throw anything. TS won't ASSUME it's an Error.
// You must narrow before using it.

try {
  throw new Error("typed error");
} catch (err) {
  // err.message;  // Error: 'err' is of type 'unknown'

  if (err instanceof Error) {
    console.log(`\nNarrowed: ${err.message}`);
  } else {
    console.log(`\nThrown non-Error: ${String(err)}`);
  }
}

// Common helper — handle both cases at once:
function toError(value: unknown): Error {
  if (value instanceof Error) return value;
  return new Error(String(value));
}

try {
  throw "just a string"; // bad practice, but it happens
} catch (err) {
  const e = toError(err);
  console.log(`Normalised: ${e.message}`);
}

// =============================================================================
// 4. CUSTOM ERROR CLASSES
// =============================================================================

// Subclass Error to create domain-specific errors. Two big benefits:
//   1. instanceof checks let you handle specific cases differently
//   2. You can attach extra context (statusCode, fieldName, etc.)

class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
  ) {
    super(message);
    this.name = "ValidationError"; // important: lets you identify the class in logs
  }
}

class NotFoundError extends Error {
  constructor(public readonly resource: string) {
    super(`${resource} not found`);
    this.name = "NotFoundError";
  }
}

function findUser(id: string): { id: string; name: string } {
  if (!id) throw new ValidationError("id is required", "id");
  if (id === "missing") throw new NotFoundError("user");
  return { id, name: "Morgan" };
}

function tryFind(id: string): void {
  try {
    const user = findUser(id);
    console.log(`\nFound: ${user.name}`);
  } catch (err) {
    if (err instanceof ValidationError) {
      console.log(`\nValidation error on ${err.field}: ${err.message}`);
    } else if (err instanceof NotFoundError) {
      console.log(`\nMissing: ${err.resource}`);
    } else if (err instanceof Error) {
      console.log(`\nUnknown error: ${err.message}`);
    }
  }
}

tryFind("");
tryFind("missing");
tryFind("user-1");

// =============================================================================
// 5. error.cause — WRAPPING ERRORS
// =============================================================================

// Python: `raise NewError("...") from original_error`
// TS:     new Error("...", { cause: originalError })  (ES2022+)
//
// This preserves the original error while adding context. Critical for debugging
// across layers of code.

function loadConfig(): { url: string } {
  try {
    return JSON.parse("{ broken json"); // throws SyntaxError
  } catch (err) {
    throw new Error("Failed to load config", { cause: err });
  }
}

try {
  loadConfig();
} catch (err) {
  if (err instanceof Error) {
    console.log(`\nOuter: ${err.message}`);
    if (err.cause instanceof Error) {
      console.log(`Caused by: ${err.cause.name}: ${err.cause.message}`);
    }
  }
}

// Always wrap errors at layer boundaries. Don't swallow the original — chain it.

// =============================================================================
// 6. ERROR HANDLING IN async FUNCTIONS
// =============================================================================

// async functions convert thrown errors into Promise rejections.
// try/catch around an `await` catches both sync and async errors uniformly.

async function fetchUser(id: string): Promise<{ id: string; name: string }> {
  if (id === "fail") throw new Error("network down");
  return { id, name: "Morgan" };
}

async function loadUser(id: string): Promise<void> {
  try {
    const user = await fetchUser(id);
    console.log(`\nLoaded: ${user.name}`);
  } catch (err) {
    if (err instanceof Error) {
      // Re-throw with context using cause
      throw new Error(`loadUser(${id}) failed`, { cause: err });
    }
    throw err;
  }
}

try {
  await loadUser("fail");
} catch (err) {
  if (err instanceof Error) {
    console.log(`\nTop-level caught: ${err.message}`);
    console.log(`  cause: ${(err.cause as Error)?.message}`);
  }
}

// Without await, you'd need .catch() — and the error would NOT propagate
// through your try/catch. This is one of the biggest reasons to prefer
// async/await over .then chains.

// =============================================================================
// 7. THE Result PATTERN (errors as values)
// =============================================================================

// Python: nothing built in (people use result/returns libraries)
// Rust:   Result<T, E> — first-class
// TS:     no built-in, but you can model it with a discriminated union
//
// The idea: instead of throwing, return a value that's EITHER success OR failure.
// The caller MUST handle both cases — TS enforces it via the discriminant.

type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

function safeDivide(a: number, b: number): Result<number> {
  if (b === 0) {
    return { ok: false, error: new Error("Division by zero") };
  }
  return { ok: true, value: a / b };
}

const r1 = safeDivide(10, 2);
if (r1.ok) {
  console.log(`\n10/2 = ${r1.value}`);
} else {
  console.log(`\n10/2 failed: ${r1.error.message}`);
}

const r2 = safeDivide(10, 0);
if (r2.ok) {
  console.log(`10/0 = ${r2.value}`);
} else {
  console.log(`10/0 failed: ${r2.error.message}`);
}

// When to use Result vs throw?
//
//   throw       — exceptional, unexpected failures (network down, file gone, bug)
//   Result      — EXPECTED failure modes that callers must handle (validation,
//                 parsing, "user not found")
//
// Throwing is more idiomatic in TS (and JS in general). Result patterns are
// more common in Rust-influenced codebases or when you want exhaustive checking.
// Both are valid — pick the style that fits the team.

// =============================================================================
// 8. THE never TYPE AND EXHAUSTIVE ERROR HANDLING
// =============================================================================

// Recall from week 1: a function returning `never` never returns normally.
// Useful for assertion helpers that throw.

function assertNever(value: never): never {
  throw new Error(`Unexpected variant: ${JSON.stringify(value)}`);
}

type Event =
  | { kind: "click"; x: number; y: number }
  | { kind: "scroll"; deltaY: number }
  | { kind: "keypress"; key: string };

function handleEvent(event: Event): string {
  switch (event.kind) {
    case "click":
      return `click at ${event.x},${event.y}`;
    case "scroll":
      return `scroll ${event.deltaY}`;
    case "keypress":
      return `key ${event.key}`;
    default:
      // If you add a new variant to Event but forget a case here,
      // `event` won't be `never` and TS will error on this line.
      return assertNever(event);
  }
}

console.log(`\n${handleEvent({ kind: "click", x: 10, y: 20 })}`);
console.log(handleEvent({ kind: "keypress", key: "Enter" }));

// =============================================================================
// 9. WHEN NOT TO CATCH
// =============================================================================

// Common anti-pattern: catching errors just to log them and continue.
//
//   try {
//     await doImportantThing();
//   } catch (err) {
//     console.log("oh well", err);  // and now the rest of the code runs as if it succeeded
//   }
//
// Either:
//   - Handle the error meaningfully (retry, fall back, return a default)
//   - Let it propagate to a higher level that knows what to do
//   - At the top level (e.g., main()), catch and log + exit cleanly
//
// Catching just to silence is almost always a bug.

// =============================================================================
// EXERCISES: Try these in your editor
// =============================================================================
// 1. Define a custom error class `TimeoutError` that takes a `ms` number in its
//    constructor and produces the message "Operation timed out after Xms".
//    Throw and catch one — log err.message in the catch block.
class TimeoutError extends Error {
  constructor(ms: number) {
    super(`Operation timed out after ${ms}ms`);
    this.name = "TimeoutError";
  }
}

function longBoi(timeTaken: number): number {
  if (timeTaken > 10) {
    throw new TimeoutError(timeTaken);
  } else {
    return timeTaken;
  }
}

try {
  longBoi(20);
} catch (err) {
  if (err instanceof Error) {
    console.log(`${err.name}: ${err.message}`);
  }
}
//
// 2. Write `safeJsonParse<T>(input: string): Result<T>` — return an ok variant
//    with the parsed value, or an error variant wrapping the SyntaxError.
//    Test it with valid and invalid JSON.
function safeJsonParse<T>(input: string): Result<T> {
  try {
    const result = JSON.parse(input);
    return { ok: true, value: result };
  } catch (err) {
    const cause = err instanceof Error ? err : new Error(String(err));
    return { ok: false, error: Error("Invalid JSON input", { cause }) };
  }
}

const validJson = safeJsonParse('{"name": "Morgan"}');
console.log(validJson);
const invalidJson = safeJsonParse("{name?Morgan");
console.log(invalidJson);
//
// 3. Write an async `fetchJson(url: string)` that:
//    - throws ValidationError if url doesn't start with "http"
//    - simulates a network call (resolve a fake object after 50ms)
//    - wraps any thrown error with `new Error("fetchJson failed", { cause: err })`
//    Call it from another async function and log the cause chain.
type httpReturnContent = { status: "success" | "fail"; content: string };

class NetworkError extends Error {
  constructor(message: string) {
    super(message);
  }
}

const fakeNetworkCall = async (url: string): Promise<httpReturnContent> => {
  const success = Math.random() > 0.5;
  if (success) {
    const result: httpReturnContent = { status: "success", content: "test" };
    return new Promise((resolve) => setTimeout(() => resolve(result), 50));
  } else {
    throw new NetworkError("Network unaccessible");
  }
};

async function fetchJson(url: string): Promise<httpReturnContent> {
  if (!url.startsWith("http")) {
    throw new ValidationError("URL must start with 'http'", "url");
  }
  try {
    const result = await fakeNetworkCall(url);
    return result;
  } catch (err) {
    const cause = err instanceof Error ? err : new Error(String(err));
    throw new Error("fetchJson failed", { cause });
  }
}

const urls = ["testURL", "http://testurl.com", "https://testingagain.co.uk"];

const results = await Promise.allSettled(urls.map((u) => fetchJson(u)));

for (const [i, r] of results.entries()) {
  const url = urls[i];
  if (r.status === "fulfilled") {
    console.log(`${url} → ${r.value.status}: ${r.value.content}`);
  } else {
    const err = r.reason;
    if (err instanceof Error) {
      console.log(`${url} failed: ${err.message}`);
      if (err.cause instanceof Error) {
        console.log(`  caused by: ${err.cause.name}: ${err.cause.message}`);
      }
    }
  }
}

//
// 4. (Bonus) Use the Result type with a discriminated error union:
//      type LoadError = { kind: "not-found" } | { kind: "permission"; user: string }
//      function loadFile(path: string): Result<string, LoadError>
//    Then handle each error variant in the caller, using assertNever for
//    exhaustiveness.
type LoadError = { kind: "not-found" } | { kind: "permission"; user: string };

function loadFile(path: string): Result<string, LoadError> {
  if (path === "missing.txt") {
    return { ok: false, error: { kind: "not-found" } };
  }
  if (path === "secret.txt") {
    return { ok: false, error: { kind: "permission", user: "Morgan" } };
  }
  return { ok: true, value: `contents of ${path}` };
}

function describeLoad(path: string): string {
  const result = loadFile(path);
  if (result.ok) {
    return `loaded ${path}: ${result.value}`;
  }
  switch (result.error.kind) {
    case "not-found":
      return `${path} does not exist`;
    case "permission":
      return `${path} not readable by ${result.error.user}`;
    default:
      return assertNever(result.error);
  }
}

console.log(`\n${describeLoad("readme.txt")}`);
console.log(describeLoad("missing.txt"));
console.log(describeLoad("secret.txt"));

console.log("\n--- Lesson 03 complete --- error handling");

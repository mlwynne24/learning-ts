// Lesson 01: Promises — async values
// Run with: npx tsx lessons/03-async-and-errors/01-promises.ts

// =============================================================================
// 1. WHAT IS A PROMISE?
// =============================================================================

// Python:  asyncio.Future, or the value an `async def` function returns before await
// TS/JS:   `Promise<T>` — a placeholder for a value that will exist later
//
// A Promise is an object representing the EVENTUAL result of an async operation.
// It's in one of three states:
//   - pending   — still working
//   - fulfilled — finished, has a value
//   - rejected  — failed, has an error
//
// Once it leaves "pending", it's frozen. You can't un-resolve a Promise.

// The simplest Promise: one that's already resolved.
const ready: Promise<number> = Promise.resolve(42);
const broken: Promise<never> = Promise.reject(new Error("nope"));

// Note the type: `Promise<T>` is generic — T is the type of the eventual value.
// Promise<number> means "this will eventually be a number (or it'll fail)."

// =============================================================================
// 2. CONSUMING A PROMISE WITH .then / .catch / .finally
// =============================================================================

// Before async/await existed, this was how you used Promises.
// You'll still see .then chains in real code — and sometimes they're the right tool.

ready.then((value) => {
  console.log(`ready resolved with: ${value}`);
});

broken.catch((err: Error) => {
  console.log(`broken rejected with: ${err.message}`);
});

// Chaining: each .then returns a NEW Promise, so you can keep going.
Promise.resolve(10)
  .then((n) => n * 2) // 20
  .then((n) => n + 5) // 25
  .then((n) => console.log(`\nChained result: ${n}`));

// .finally runs no matter what — like Python's try/finally.
Promise.resolve("done").finally(() => {
  console.log("finally ran (cleanup goes here)");
});

// =============================================================================
// 3. CREATING A PROMISE FROM SCRATCH
// =============================================================================

// You rarely need to do this — most APIs already return Promises.
// But it's worth seeing once so the abstraction isn't magic.

// The Promise constructor takes an "executor" function with two callbacks:
//   resolve(value) — fulfill the Promise
//   reject(error) — reject the Promise

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// Now we have an awaitable sleep function (Node has timers/promises.setTimeout
// built in — that's how you'd do it for real).

delay(100).then(() => {
  console.log("\n100ms passed (via custom delay)");
});

// A Promise that might fail:
function divide(a: number, b: number): Promise<number> {
  return new Promise((resolve, reject) => {
    if (b === 0) {
      reject(new Error("Division by zero"));
    } else {
      resolve(a / b);
    }
  });
}

divide(10, 2).then((r) => console.log(`10/2 = ${r}`));
divide(10, 0).catch((e: Error) => console.log(`10/0 → ${e.message}`));

// =============================================================================
// 4. THE EVENT LOOP (briefly)
// =============================================================================

// Python: asyncio's event loop — same idea
// JS/TS:  the event loop is BUILT INTO the runtime. There's no `asyncio.run()`.
//
// Anything async (timers, I/O, Promises) is queued. The event loop picks
// tasks off the queue when the current synchronous code finishes.
//
// This means: synchronous code ALWAYS runs to completion before any
// Promise callback fires. Even an already-resolved Promise.

console.log("\n=== Event loop demo ===");
console.log("1: sync");

Promise.resolve().then(() => console.log("3: microtask (Promise callback)"));

setTimeout(() => console.log("4: macrotask (setTimeout)"), 0);

console.log("2: sync");

// Output order: 1, 2, 3, 4
// Promise callbacks run BEFORE setTimeout callbacks, even with timeout 0.
// That's because Promises use the "microtask queue", which has higher priority
// than the "macrotask queue" used by timers and I/O.
//
// You don't need to memorise this. Just know: console.logs in your sync code
// always run first. Async stuff comes later, in a predictable order.

// =============================================================================
// 5. PROMISES ARE EAGER (unlike Python coroutines)
// =============================================================================

// Important difference from Python!
//
// In Python:
//   async def foo(): print("running"); return 1
//   coro = foo()        # Nothing prints — coroutine is lazy
//   await coro          # NOW it runs
//
// In TS/JS:
//   function foo() { console.log("running"); return Promise.resolve(1); }
//   const p = foo();    // "running" prints IMMEDIATELY
//   await p;            // Just retrieves the already-known result

function eager(): Promise<number> {
  console.log("\n[eager] body executing");
  return Promise.resolve(99);
}

const p = eager(); // logs immediately
p.then((v) => console.log(`[eager] resolved: ${v}`));

// Why this matters: if you call an async function, the work STARTS RIGHT THEN.
// You don't have to await it for it to begin. This affects how you parallelise
// work — more on this in lesson 04.

// =============================================================================
// 6. TYPING PROMISES
// =============================================================================

// The return type of any function that returns a Promise is `Promise<T>`.
// TS infers it correctly in most cases.

function fetchUserId(): Promise<string> {
  return Promise.resolve("user-123");
}

// Inferred: Promise<{ id: string; name: string }>
function fetchUser(): Promise<{ id: string; name: string }> {
  return Promise.resolve({ id: "user-123", name: "Morgan" });
}

// When you chain .then, the return type of the callback becomes the new T:
const upperName: Promise<string> = fetchUser().then((u) => u.name.toUpperCase());

upperName.then((n) => console.log(`\nUpper: ${n}`));

// If a .then callback returns a Promise, TS "unwraps" it — no nesting.
// fetchUserId().then(id => fetchUser()) → Promise<{ id, name }>, NOT Promise<Promise<...>>

fetchUserId()
  .then((id) => {
    console.log(`Got id: ${id}`);
    return fetchUser(); // returning a Promise...
  })
  .then((user) => {
    // ...gets unwrapped here. `user` is the resolved value, not a Promise.
    console.log(`Got user: ${user.name}`);
  });

// =============================================================================
// 7. WHY .then CHAINS GET PAINFUL
// =============================================================================

// Imagine fetching a user, then their posts, then the comments on the first post:
//
//   fetchUser()
//     .then(user => fetchPosts(user.id)
//       .then(posts => fetchComments(posts[0].id)
//         .then(comments => {
//           // deeply nested, hard to read, error handling is awkward
//         })))
//
// This is "callback hell, Promise edition." Async/await fixes it (lesson 02).
// You'll occasionally still see .then chains for short pipelines — they're fine.
// But for anything multi-step, async/await is dramatically clearer.

// =============================================================================
// 8. UNHANDLED REJECTIONS — THE FOOTGUN
// =============================================================================

// If a Promise rejects and nothing handles the error, Node logs an
// "UnhandledPromiseRejection" warning. In strict mode (or Node 15+), the
// process exits.
//
// Always either:
//   - .catch() the Promise
//   - await it inside a try/catch
//   - explicitly mark it ignored: `void somePromise()` (rare)
//
// ESLint's `no-floating-promises` rule (we have it on) catches this for you.
// You'll see it complain if you call an async function and don't handle it.

// Demo: this would be a problem if uncommented:
// Promise.reject(new Error("uncaught!"));
// (We're not actually doing it because Node will warn and possibly exit.)

// =============================================================================
// EXERCISES: Try these in your editor
// =============================================================================
// 1. Write a function `wait(ms: number): Promise<void>` that resolves after ms
//    milliseconds. Use it to log "tick" then "tock" 500ms apart.
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

console.log("tick");
wait(500).then(() => {
  console.log("tock");
});
//
// 2. Write a function `coinFlip(): Promise<"heads" | "tails">` that resolves
//    randomly to one of the two values after a 200ms delay.
function coinFlip(): Promise<"heads" | "tails"> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const result = Math.random() < 0.5 ? "heads" : "tails";
      resolve(result);
    }, 200);
  });
}

coinFlip().then((result) => {
  console.log(result);
});
//
// 3. Write a function `firstSuccessfulHttp(): Promise<number>` that resolves
//    to 200 if Math.random() > 0.5, otherwise rejects with new Error("502").
//    Use .then and .catch to log the outcome.
function firstSuccessfulHttp(): Promise<number> {
  return new Promise((resolve, reject) => {
    const result = Math.random() > 0.5;
    if (result) {
      resolve(200);
    } else {
      reject(new Error("502"));
    }
  });
}

firstSuccessfulHttp()
  .then((result) => console.log(`HTTP success: ${result}`))
  .catch((err: Error) => console.log(`HTTP failed: ${err.message}`));
//
// 4. (Bonus) Write a function `chainOps(start: number): Promise<number>` that
//    takes a number, multiplies by 2, then adds 10, then divides by 4 — each
//    step in its own .then. Log the final result.
function chainOps(start: number): Promise<number> {
  return Promise.resolve(start)
    .then((n) => n * 2)
    .then((n) => n + 10)
    .then((n) => n / 4);
}

chainOps(5).then((n) => {
  console.log(`Final result: ${n}`);
});
//
// Make sure all top-level Promises in this file are awaited or .then'd before
// the process exits. Otherwise you'll see logs out of order.

console.log("\n--- Lesson 01 complete --- promises");

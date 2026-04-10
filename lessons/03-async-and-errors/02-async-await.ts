// Lesson 02: async / await
// Run with: npx tsx lessons/03-async-and-errors/02-async-await.ts

// =============================================================================
// 1. async / await — SYNTACTIC SUGAR FOR PROMISES
// =============================================================================

// Python: async def / await — works almost identically
// TS/JS:  async function / await
//
// Under the hood, async/await is JUST Promises. An `async` function ALWAYS
// returns a Promise. `await` pauses the function until that Promise resolves.
//
// The whole point is readability: turn nested .then chains into linear code
// that looks synchronous.

// Compare these two — they do the same thing:

// .then style:
function fetchUserThen(id: string): Promise<string> {
  return Promise.resolve({ id, name: "Morgan" }).then((user) => `User: ${user.name}`);
}

// async/await style:
async function fetchUserAwait(id: string): Promise<string> {
  const user = await Promise.resolve({ id, name: "Morgan" });
  return `User: ${user.name}`;
}

// Both have type `(id: string) => Promise<string>`.
// The async version reads top-to-bottom, like normal code.

// =============================================================================
// 2. async FUNCTIONS ALWAYS RETURN PROMISES
// =============================================================================

// Even if you `return 42`, the actual return type is `Promise<number>`.
// TS infers this automatically.

async function getNumber() {
  return 42; // Inferred return type: Promise<number>
}

async function getNothing(): Promise<void> {
  console.log("doing work");
  // No return — Promise<void>
}

// Calling an async function gives you back a Promise — you can't get the value
// without awaiting it (or using .then).

const promise = getNumber();
console.log(`\ngetNumber() returned: ${promise}`); // [object Promise], NOT 42

// Use it properly — wrap top-level awaits in an async IIFE (immediately invoked
// function expression). Or just .then it.
//
// Note: Node also supports "top-level await" in ESM modules — you can write
// `const x = await foo();` at the top of a .ts file. We use IIFEs in these
// lessons so the call order is explicit.

await (async () => {
  const value = await getNumber();
  console.log(`After await, value = ${value}`);
})();

// =============================================================================
// 3. AWAIT ONLY WORKS INSIDE async FUNCTIONS (mostly)
// =============================================================================

// Python: same rule — `await` only inside `async def`.
//
// Two exceptions in modern TS:
//   1. Top-level await in ES modules (we showed this above)
//   2. Inside `for await...of` loops (lesson 04)

// Trying to use await in a regular function is an error:
//   function bad() {
//     const x = await getNumber();  // Syntax error
//   }

// =============================================================================
// 4. SEQUENTIAL vs PARALLEL — THE BIG GOTCHA
// =============================================================================

// Easy mistake: awaiting things one at a time when they could run in parallel.

function fetchA(): Promise<string> {
  return new Promise((resolve) => setTimeout(() => resolve("A"), 200));
}

function fetchB(): Promise<string> {
  return new Promise((resolve) => setTimeout(() => resolve("B"), 200));
}

// SEQUENTIAL: ~400ms total. B starts only after A finishes.
async function sequential(): Promise<void> {
  const start = Date.now();
  const a = await fetchA();
  const b = await fetchB();
  console.log(`\nSequential: [${a}, ${b}] in ${Date.now() - start}ms`);
}

// PARALLEL: ~200ms total. Both start at the same time.
// Key insight: Promises start running IMMEDIATELY when you call the function.
// So if you call both functions BEFORE awaiting, they run concurrently.
async function parallel(): Promise<void> {
  const start = Date.now();
  const aPromise = fetchA(); // starts now
  const bPromise = fetchB(); // also starts now
  const a = await aPromise; // wait for the already-running A
  const b = await bPromise; // wait for the already-running B
  console.log(`Parallel:   [${a}, ${b}] in ${Date.now() - start}ms`);
}

// Cleaner parallel: Promise.all (lesson 04 covers this in depth)
async function withPromiseAll(): Promise<void> {
  const start = Date.now();
  const [a, b] = await Promise.all([fetchA(), fetchB()]);
  console.log(`Promise.all: [${a}, ${b}] in ${Date.now() - start}ms`);
}

await sequential();
await parallel();
await withPromiseAll();

// Rule of thumb: if two awaits don't depend on each other, they should run in parallel.
// Sequential awaits in a row = a code smell (unless one needs the previous result).

// =============================================================================
// 5. ERROR HANDLING WITH try / catch
// =============================================================================

// Python: try / except — same idea
// TS:     try / catch — works for both sync errors AND awaited Promise rejections

async function risky(): Promise<string> {
  if (Math.random() > 0.5) {
    throw new Error("Random failure!");
  }
  return "success";
}

async function handleRisky(): Promise<void> {
  try {
    const result = await risky();
    console.log(`\nrisky() returned: ${result}`);
  } catch (err) {
    // err is typed as `unknown` in strict mode (more on this in lesson 03)
    if (err instanceof Error) {
      console.log(`\nrisky() failed: ${err.message}`);
    }
  }
}

await handleRisky();

// Without try/catch, the rejection becomes an unhandled rejection — the same
// problem we saw in lesson 01. Always handle errors at SOME level.

// =============================================================================
// 6. AWAIT IN LOOPS
// =============================================================================

// Three patterns. Pick the one that matches your intent.

const ids = ["1", "2", "3"];

function fetchItem(id: string): Promise<string> {
  return new Promise((resolve) => setTimeout(() => resolve(`item-${id}`), 100));
}

// --- Pattern A: sequential (one at a time) ---
// Use when each iteration depends on the previous, or when you must rate-limit.
async function loopSequential() {
  const start = Date.now();
  const results: string[] = [];
  for (const id of ids) {
    const item = await fetchItem(id); // wait before next
    results.push(item);
  }
  console.log(`\nLoop sequential: ${results.join(", ")} (${Date.now() - start}ms)`);
}

// --- Pattern B: parallel via Promise.all + map ---
// Use when iterations are independent and you want max throughput.
async function loopParallel() {
  const start = Date.now();
  const results = await Promise.all(ids.map((id) => fetchItem(id)));
  console.log(`Loop parallel:   ${results.join(", ")} (${Date.now() - start}ms)`);
}

// --- Pattern C: forEach is BROKEN with async ---
// forEach doesn't await its callback — the function continues immediately,
// and the loop finishes before any of the work is done.
async function loopForEachBug() {
  const results: string[] = [];
  ids.forEach(async (id) => {
    const item = await fetchItem(id);
    results.push(item); // happens AFTER this function returns
  });
  console.log(`Loop forEach:    ${results.join(", ")} (this is empty — bug!)`);
}

await loopSequential();
await loopParallel();
await loopForEachBug();

// ESLint's `no-misused-promises` catches the forEach bug. Trust the linter here.

// =============================================================================
// 7. RETURNING vs AWAITING
// =============================================================================

// You have two equivalent ways to return a Promise from an async function:

async function passthroughA(): Promise<string> {
  return fetchA(); // return the Promise directly
}

async function passthroughB(): Promise<string> {
  return await fetchA(); // await, then return the value
}

// Both work. The first is slightly more efficient (no extra microtask).
// The second gives better stack traces in errors. Either is fine.
//
// ESLint has `no-return-await` (which prefers A) and `return-await` (which
// prefers B). Pick one convention per project. We don't enforce either.

// =============================================================================
// 8. async ARROW FUNCTIONS
// =============================================================================

// Same rules apply — just add `async` before the parameter list.

const greet = async (name: string): Promise<string> => {
  await delay(50);
  return `Hello, ${name}`;
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

console.log(`\n${await greet("Morgan")}`);

// Common use: array methods with async callbacks.
// Remember: .map gives you Promise[], which you then Promise.all.
const greetings = await Promise.all(["Alice", "Bob", "Carol"].map(greet));
console.log(`Greetings: ${greetings.join(" | ")}`);

// =============================================================================
// EXERCISES: Try these in your editor
// =============================================================================
// 1. Rewrite this .then chain as an async function:
//    fetchA().then(a => fetchB().then(b => console.log(a + b)))
//    Use Promise.all if the two fetches don't depend on each other.
//
// 2. Write `fetchAllUsers(ids: string[]): Promise<string[]>` that fetches each
//    id IN PARALLEL and returns the results. Use Promise.all + map.
//
// 3. Write `fetchUsersOneByOne(ids: string[]): Promise<string[]>` that fetches
//    them sequentially (e.g., for rate-limited APIs). Use a for...of loop.
//
// 4. Write `safeDivide(a: number, b: number): Promise<number>` that rejects
//    with Error("div by zero") when b is 0 and resolves to a/b otherwise.
//    Call it from another async function and handle both cases with try/catch.
//
// 5. (Bonus) Time the difference between sequential and parallel for fetching
//    10 ids. The parallel version should be roughly 10x faster.

console.log("\n--- Lesson 02 complete --- async / await");

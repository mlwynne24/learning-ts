// Lesson 02: Generic types, interfaces, and classes
// Run with: npx tsx lessons/05-generics-and-advanced-types/02-generic-types-and-classes.ts

// =============================================================================
// 1. GENERIC INTERFACES
// =============================================================================

// Interfaces can take type parameters the same way functions can.
// This is how Array<T>, Map<K, V>, and Promise<T> are declared in the TS stdlib.

interface Box<T> {
  value: T;
  label: string;
}

const numBox: Box<number> = { value: 42, label: "answer" };
const strBox: Box<string> = { value: "hi", label: "greeting" };

console.log(`${numBox.label}: ${numBox.value}`);
console.log(`${strBox.label}: ${strBox.value}`);

// You can make parts of the interface depend on T:
interface Container<T> {
  items: T[];
  add(item: T): void;
  first(): T | undefined;
}

// Now any function that takes Container<string> only accepts a string array
// and string pushes. No casting.

// =============================================================================
// 2. GENERIC TYPE ALIASES
// =============================================================================

// `type` works the same. You'll reach for it more often because `type` can
// also express unions, tuples, and intersections — interfaces can't.

type Maybe<T> = T | null | undefined;
type Pair<A, B> = [A, B];
type Dict<V> = Record<string, V>; // Record is covered in lesson 3

const maybeName: Maybe<string> = null;
const coord: Pair<number, number> = [3, 4];
const counts: Dict<number> = { apples: 3, pears: 2 };

console.log(`\nmaybeName: ${maybeName}, coord: ${coord}, counts.apples: ${counts.apples}`);

// --- The Result type, used properly ---
// From lesson 3.3 — this is probably the most useful generic type you'll write.

type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

function parseIntStrict(input: string): Result<number> {
  const n = Number(input);
  if (Number.isNaN(n)) return { ok: false, error: new Error(`not a number: ${input}`) };
  return { ok: true, value: n };
}

const r1 = parseIntStrict("42");
const r2 = parseIntStrict("oops");
console.log(`\nr1: ${r1.ok ? r1.value : r1.error.message}`);
console.log(`r2: ${r2.ok ? r2.value : r2.error.message}`);

// =============================================================================
// 3. GENERIC CLASSES
// =============================================================================

// Python: class Stack(Generic[T])
// TS:     class Stack<T>

class Stack<T> {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  get size(): number {
    return this.items.length;
  }

  toArray(): readonly T[] {
    return [...this.items];
  }
}

const numbers = new Stack<number>();
numbers.push(1);
numbers.push(2);
numbers.push(3);
console.log(`\nstack peek: ${numbers.peek()}, pop: ${numbers.pop()}, size: ${numbers.size}`);

// Different instantiations, different types — no casts:
const words = new Stack<string>();
words.push("hello");
// words.push(42);  // Error: argument of type 'number' not assignable to 'string'

// Compare with the non-generic Stack in week 1, lesson 06 — that one was locked
// to strings. This one works with anything, and each instance stays type-safe.

// =============================================================================
// 4. GENERIC METHODS (inside generic AND non-generic classes)
// =============================================================================

// A method can have its OWN type parameters, separate from the class's.

class Repository<T> {
  private items: T[] = [];

  add(item: T): void {
    this.items.push(item);
  }

  // <U> here is scoped to this method only — unrelated to T.
  mapAll<U>(fn: (item: T) => U): U[] {
    return this.items.map(fn);
  }
}

const userRepo = new Repository<{ name: string; age: number }>();
userRepo.add({ name: "Morgan", age: 30 });
userRepo.add({ name: "Alex", age: 28 });

const names: string[] = userRepo.mapAll((u) => u.name);
const ages: number[] = userRepo.mapAll((u) => u.age);

console.log(`\nnames: ${names}, ages: ${ages}`);

// =============================================================================
// 5. CONSTRAINTS ON CLASS TYPE PARAMETERS
// =============================================================================

// Same idea as function constraints — narrow what T can be.

interface Identifiable {
  id: string;
}

class IdRepository<T extends Identifiable> {
  private items = new Map<string, T>();

  save(item: T): void {
    this.items.set(item.id, item); // OK — T is guaranteed to have id
  }

  findById(id: string): T | undefined {
    return this.items.get(id);
  }

  all(): T[] {
    return [...this.items.values()];
  }
}

interface Task extends Identifiable {
  title: string;
  done: boolean;
}

const tasks = new IdRepository<Task>();
tasks.save({ id: "t1", title: "Learn generics", done: true });
tasks.save({ id: "t2", title: "Learn utility types", done: false });

console.log(
  `\nall tasks: ${tasks
    .all()
    .map((t) => t.title)
    .join(", ")}`,
);
console.log(`t1: ${tasks.findById("t1")?.title}`);

// Try constructing IdRepository<{ title: string }> — TS errors because
// { title: string } doesn't extend Identifiable (missing `id`).

// =============================================================================
// 6. DEFAULT TYPE PARAMETERS
// =============================================================================

// Python: no direct equivalent
// TS:     like default function parameters, but for types

// You've seen this in the Result type. Here's another common one.

interface ApiResponse<T = unknown> {
  status: number;
  data: T;
  error?: string;
}

// Can be used without specifying T:
const unknownResponse: ApiResponse = { status: 200, data: { anything: true } };
// unknownResponse.data is `unknown` — you'd need to narrow it before using

// Or specify T when you know the shape:
const userResponse: ApiResponse<{ id: string; name: string }> = {
  status: 200,
  data: { id: "u1", name: "Morgan" },
};

console.log(`\nstatus: ${userResponse.status}, user: ${userResponse.data.name}`);

// Defaults are handy for progressive typing: start with `unknown`, tighten later.

// =============================================================================
// 7. GENERIC FUNCTION TYPES
// =============================================================================

// You can store generic functions in a type. Note where the <T> lives.

type Mapper = <T, U>(arr: T[], fn: (item: T) => U) => U[];

const myMap: Mapper = (arr, fn) => arr.map(fn);

const upper = myMap(["a", "b"], (s) => s.toUpperCase());
console.log(`\ngeneric mapper: ${upper}`);

// Compare with a generic TYPE ALIAS — the <T, U> sits outside:
type MapperAlias<T, U> = (arr: T[], fn: (item: T) => U) => U[];

// With MapperAlias you pick T and U when declaring the variable:
const strToNum: MapperAlias<string, number> = (arr, fn) => arr.map(fn);

const lengths = strToNum(["hi", "hello"], (s) => s.length);
console.log(`lengths: ${lengths}`);

// The difference matters:
//   `type Mapper = <T, U>(...) => ...`           — generic CALLABLE, caller picks each time
//   `type MapperAlias<T, U> = (...) => ...`      — locked to specific T, U at declaration

// =============================================================================
// 8. INTERFACES WITH GENERIC METHODS vs GENERIC INTERFACES
// =============================================================================

// Subtle but important distinction — same as above, one step further.

// Generic INTERFACE — whoever implements it picks T once.
interface Collection<T> {
  add(item: T): void;
  all(): T[];
}

// Interface with a generic METHOD — method picks T per-call.
interface Cloner {
  clone<T>(value: T): T;
}

class StringCollection implements Collection<string> {
  private items: string[] = [];
  add(item: string) {
    this.items.push(item);
  }
  all() {
    return this.items;
  }
}

class DeepCloner implements Cloner {
  clone<T>(value: T): T {
    return structuredClone(value); // Node 17+ has this built in
  }
}

const cloner = new DeepCloner();
const a = cloner.clone({ nested: [1, 2, 3] });
const b = cloner.clone("hello");
console.log(`\ncloned object: ${JSON.stringify(a)}, cloned string: ${b}`);

// =============================================================================
// 9. REAL-WORLD PATTERN — A TYPED EVENT EMITTER
// =============================================================================

// Events are a classic place for generics. Each event has its own payload shape.

type EventHandler<T> = (payload: T) => void;

class TypedEmitter<Events extends Record<string, unknown>> {
  private handlers: { [K in keyof Events]?: EventHandler<Events[K]>[] } = {};

  on<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): void {
    (this.handlers[event] ??= []).push(handler);
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    for (const h of this.handlers[event] ?? []) h(payload);
  }
}

// Declare the event map — event name to payload type.
// Note: using `type` (not `interface`) so TS treats it as a plain record that
// satisfies `Record<string, unknown>`. Interfaces don't get an implicit index
// signature, so they fail the constraint.
type AppEvents = {
  login: { userId: string };
  logout: { userId: string; at: Date };
  error: { message: string; code: number };
};

const events = new TypedEmitter<AppEvents>();

events.on("login", (p) => console.log(`\nlogin: ${p.userId}`)); // p typed correctly
events.on("error", (p) => console.log(`error ${p.code}: ${p.message}`));

events.emit("login", { userId: "u1" });
events.emit("error", { message: "oops", code: 500 });
// events.emit("login", { wrong: "shape" });  // Error — payload must match AppEvents.login

// This pattern appears in Node's EventEmitter-style APIs, socket.io, tRPC, etc.
// Don't panic if it's dense — we'll revisit keyof and mapped types in lesson 4.

// =============================================================================
// EXERCISES: Try these in your editor
// =============================================================================
// 1. Write a generic `Queue<T>` class with enqueue, dequeue, peek, and a `size`
//    getter. Use a private array internally. Make dequeue return T | undefined.
//    Test with Queue<number> and Queue<{ id: string; title: string }>.
class Queue<T> {
  private arr: T[] = [];
  get size(): number {
    return this.arr.length;
  }
  enqueue(item: T): void {
    this.arr.push(item);
  }
  dequeue(): T | undefined {
    return this.arr.shift();
  }
  peek(): T | undefined {
    return this.arr[0];
  }
}

const numberQueue: Queue<number> = new Queue();
numberQueue.enqueue(6);
numberQueue.enqueue(7);
numberQueue.enqueue(8);
console.log(numberQueue.size);
console.log(numberQueue.dequeue());
console.log(numberQueue.size);
console.log(numberQueue.peek());
//
// 2. Define a generic interface `Comparable<T>` with a single method
//    `compareTo(other: T): number` (negative, zero, or positive — like Java).
//    Make a class `Money` that implements Comparable<Money> with an `amount`
//    property, and sort an array of Money instances using arr.sort((a, b) => a.compareTo(b)).
interface Comparable<T> {
  compareTo(other: T): number;
}

class Money implements Comparable<Money> {
  constructor(private amount: number) {}
  compareTo(money: Money): number {
    return this.amount - money.amount;
  }
}

const moneys: Money[] = [new Money(5), new Money(7), new Money(3)];

console.log(moneys.sort((a, b) => a.compareTo(b)));
//
// 3. Define `type ApiCall<TReq, TRes> = (req: TReq) => Promise<TRes>`. Write a
//    `withLogging` higher-order function that takes an ApiCall and returns an
//    ApiCall that logs the request and response but passes through the types.
//    Hint: `function withLogging<TReq, TRes>(fn: ApiCall<TReq, TRes>): ApiCall<TReq, TRes>`.
type ApiCall<TReq, TRes> = (req: TReq) => Promise<TRes>;

function withLogging<TReq, TRes>(fn: ApiCall<TReq, TRes>): ApiCall<TReq, TRes> {
  return async (req: TReq) => {
    console.log(req);
    const result = await fn(req);
    console.log(result);
    return result;
  };
}

type User = { id: string; name: string };
type enrichedUser = { id: string; name: string; email: string };
const enrichUser = async (user: User): Promise<enrichedUser> => {
  return {
    ...user,
    email: "test@test.com",
  };
};

const testUser = { id: "001", name: "Morgan" };
await withLogging(enrichUser)(testUser);
//
// 4. (Bonus) Write `class LruCache<K, V>` with get, set, and a `max` capacity.
//    When set exceeds max, evict the least-recently-used key. Use Map for O(1)
//    operations and rely on Map's insertion-order iteration.
//    Signature: `new LruCache<string, number>(max: 3)`.
class LruCache<K, V> {
  constructor(
    public readonly max: number,
    private cache = new Map<K, V>(),
  ) {}
  get(item: K): V | undefined {
    const val = this.cache.get(item);
    if (val !== undefined) {
      this.cache.delete(item);
      this.cache.set(item, val);
    }
    return val;
  }
  set(item: K, value: V): void {
    this.cache.set(item, value);
    if (this.cache.size > this.max) {
      this.cache.delete(this.cache.keys().next().value as K);
    }
  }
}

const cache = new LruCache<string, number>(3);

console.log("\n--- Lesson 02 complete --- generic types and classes");

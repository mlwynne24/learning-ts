// Lesson 06: Classes
// Run with: npx ts-node --esm lessons/01-fundamentals/06-classes.ts

// =============================================================================
// 1. BASIC CLASS SYNTAX
// =============================================================================

// Python:
//   class User:
//       def __init__(self, name: str, age: int):
//           self.name = name
//           self.age = age
//
// TS:

class User {
  name: string;
  age: number;

  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }

  greet(): string {
    return `Hi, I'm ${this.name}`;
  }
}

const user = new User("Morgan", 30);
console.log(user.greet());

// Key differences from Python:
// - Properties must be declared in the class body (not just assigned in __init__)
// - `this` instead of `self` — and it's required
// - `constructor` instead of `__init__`
// - No `def` — just method name and parens

// =============================================================================
// 2. PARAMETER PROPERTIES (shorthand)
// =============================================================================

// Declaring properties AND assigning them in the constructor is repetitive.
// TS has a shorthand — add an access modifier to the constructor parameter:

class Product {
  constructor(
    public name: string,
    public price: number,
    public inStock: boolean = true,
  ) {}
  // No body needed! TS creates and assigns the properties automatically.

  display(): string {
    return `${this.name}: $${this.price.toFixed(2)} ${this.inStock ? "✓" : "✗"}`;
  }
}

const laptop = new Product("MacBook", 2499.99);
console.log(`\n${laptop.display()}`);
console.log(`Direct access: ${laptop.name}, $${laptop.price}`);

// This is equivalent to the verbose version in section 1 — just less typing.
// Most TS code uses this shorthand.

// =============================================================================
// 3. ACCESS MODIFIERS
// =============================================================================

// Python: _private by convention, no enforcement
// TS:     public / private / protected — enforced at compile time

class BankAccount {
  constructor(
    public owner: string,
    private balance: number, // only accessible inside this class
  ) {}

  deposit(amount: number): void {
    if (amount <= 0) throw new Error("Amount must be positive");
    this.balance += amount;
  }

  withdraw(amount: number): void {
    if (amount > this.balance) throw new Error("Insufficient funds");
    this.balance -= amount;
  }

  getBalance(): number {
    return this.balance;
  }
}

const account = new BankAccount("Morgan", 1000);
account.deposit(500);
console.log(`\nBalance: $${account.getBalance()}`);
// account.balance;  // Error: Property 'balance' is private

// public    — accessible everywhere (default)
// private   — accessible only inside the class
// protected — accessible in the class AND subclasses (like Python's convention)
// readonly  — can be set in constructor only, then immutable

class ServerConfig {
  constructor(
    public readonly host: string,
    public readonly port: number,
  ) {}
}

const config = new ServerConfig("localhost", 3000);
// config.port = 8080;  // Error: Cannot assign to 'port' because it is read-only

console.log(`Server: ${config.host}:${config.port}`);

// =============================================================================
// 4. GETTERS AND SETTERS
// =============================================================================

// Python: @property
// TS:     get / set keywords

class Temperature {
  constructor(private celsius: number) {}

  get fahrenheit(): number {
    return this.celsius * 9 / 5 + 32;
  }

  set fahrenheit(f: number) {
    this.celsius = (f - 32) * 5 / 9;
  }

  toString(): string {
    return `${this.celsius.toFixed(1)}°C / ${this.fahrenheit.toFixed(1)}°F`;
  }
}

const temp = new Temperature(100);
console.log(`\nBoiling: ${temp}`);

temp.fahrenheit = 72;
console.log(`Room temp: ${temp}`);

// =============================================================================
// 5. INHERITANCE
// =============================================================================

// Python: class Dog(Animal):
// TS:     class Dog extends Animal

class Animal {
  constructor(
    public name: string,
    protected sound: string, // subclasses can access this
  ) {}

  speak(): string {
    return `${this.name} says ${this.sound}`;
  }
}

class Dog extends Animal {
  constructor(name: string) {
    super(name, "Woof"); // must call super() — like Python's super().__init__()
  }

  fetch(item: string): string {
    return `${this.name} fetches the ${item}!`;
  }
}

class Cat extends Animal {
  constructor(name: string) {
    super(name, "Meow");
  }

  purr(): string {
    return `${this.name} purrs...`;
  }
}

const dog = new Dog("Rex");
const cat = new Cat("Whiskers");
console.log(`\n${dog.speak()}`);
console.log(dog.fetch("ball"));
console.log(cat.speak());
console.log(cat.purr());

// =============================================================================
// 6. IMPLEMENTING INTERFACES
// =============================================================================

// Python: class MyClass(Protocol): ... (structural)
// TS:     class MyClass implements MyInterface (explicit)

// TS has structural typing (lesson 03), so `implements` is optional —
// but it's a useful contract that gives you immediate errors if you
// forget a method.

interface Serializable {
  serialize(): string;
}

interface Loggable {
  log(): void;
}

class Task implements Serializable, Loggable {
  constructor(
    public id: string,
    public title: string,
    public done: boolean = false,
  ) {}

  serialize(): string {
    return JSON.stringify({ id: this.id, title: this.title, done: this.done });
  }

  log(): void {
    console.log(`[Task ${this.id}] ${this.title} (${this.done ? "done" : "pending"})`);
  }

  complete(): void {
    this.done = true;
  }
}

const task = new Task("1", "Learn TypeScript classes");
task.log();
task.complete();
task.log();
console.log(`Serialized: ${task.serialize()}`);

// The interface guarantees the shape. The class provides the implementation.
// Other code can depend on `Serializable` without knowing about `Task`.

// =============================================================================
// 7. ABSTRACT CLASSES
// =============================================================================

// Python: from abc import ABC, abstractmethod
// TS:     abstract class — can't be instantiated directly

abstract class Shape {
  abstract area(): number; // subclasses MUST implement this
  abstract perimeter(): number;

  describe(): string {
    // Concrete method — shared by all subclasses
    return `Area: ${this.area().toFixed(2)}, Perimeter: ${this.perimeter().toFixed(2)}`;
  }
}

class Circle extends Shape {
  constructor(public radius: number) {
    super();
  }

  area(): number {
    return Math.PI * this.radius ** 2;
  }

  perimeter(): number {
    return 2 * Math.PI * this.radius;
  }
}

class Rect extends Shape {
  constructor(
    public width: number,
    public height: number,
  ) {
    super();
  }

  area(): number {
    return this.width * this.height;
  }

  perimeter(): number {
    return 2 * (this.width + this.height);
  }
}

// const s = new Shape();  // Error: Cannot create an instance of an abstract class

const circle = new Circle(5);
const rect = new Rect(4, 6);
console.log(`\nCircle: ${circle.describe()}`);
console.log(`Rect: ${rect.describe()}`);

// Abstract class vs Interface — when to use which?
// - Interface: just the shape, no implementation. Use when you want a contract.
// - Abstract class: shared implementation + required methods. Use when subclasses
//   share behavior. Can only extend ONE class, but implement MANY interfaces.

// =============================================================================
// 8. STATIC MEMBERS
// =============================================================================

// Same concept as Python's @staticmethod and class variables

class Counter {
  static count = 0;

  constructor(public label: string) {
    Counter.count++;
  }

  static getCount(): number {
    return Counter.count;
  }
}

new Counter("a");
new Counter("b");
new Counter("c");
console.log(`\nInstances created: ${Counter.getCount()}`); // 3

// =============================================================================
// 9. CLASSES vs INTERFACES + FUNCTIONS
// =============================================================================

// Important perspective for a Python dev: TS (and JS) is NOT as class-heavy
// as Python or Java. Many TS codebases prefer:
//   - Interfaces for shapes
//   - Functions (not methods) for behavior
//   - Plain objects instead of class instances
//
// Classes shine when you need:
//   - Encapsulation (private state)
//   - Inheritance hierarchies
//   - instanceof checks
//   - Lifecycle management (constructors, cleanup)
//
// For simple data containers, a plain interface is usually better:
//   interface User { name: string; age: number }    ← preferred
//   class User { constructor(public name...) }      ← overkill if no methods

// You'll see both styles in real codebases. Libraries like Express use classes
// sparingly; React moved AWAY from classes to functions + hooks.

// =============================================================================
// EXERCISES: Try these in your editor
// =============================================================================
// 1. Create a class `Stack<T>` (don't worry about the <T> syntax yet — just
//    use `string` for now) with:
//    - private items: string[]
//    - push(item: string): void
//    - pop(): string | undefined
//    - peek(): string | undefined
//    - get size(): number (getter)
//
// 2. Create an abstract class `Notification` with:
//    - abstract send(): void
//    - a concrete method `format()` that returns "[{type}] {message}"
//    Then create two subclasses: EmailNotification and SmsNotification.
//
// 3. Create an interface `Repository` with methods:
//    - findById(id: string): Task | undefined
//    - save(task: Task): void
//    - delete(id: string): boolean
//    Implement it as `InMemoryRepository` using a private Map or array.
//
// 4. (Bonus) Refactor the BankAccount class to add:
//    - A transaction history (private array of { type: "deposit" | "withdraw", amount: number, date: Date })
//    - A getStatement() method that returns the history as a formatted string

console.log("\n--- Lesson 06 complete --- classes");
console.log("\n🎉 Week 1 fundamentals complete! Next up: generics, utility types, and more.");

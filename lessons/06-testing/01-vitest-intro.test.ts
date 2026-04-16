// Companion tests for 01-vitest-intro.ts
// Run with: npm run test  (or: npx vitest run lessons/06-testing)

import { describe, it, expect, beforeEach } from "vitest";
import { add, greet, uniq, isAdult, type User } from "./01-vitest-intro.js";

// =============================================================================
// 1. SIMPLE ASSERTIONS — add()
// =============================================================================

describe("add", () => {
  it("sums two positive numbers", () => {
    expect(add(2, 3)).toBe(5);
  });

  it("handles negative numbers", () => {
    expect(add(-2, -3)).toBe(-5);
  });

  it("returns 0 when both inputs are 0", () => {
    expect(add(0, 0)).toBe(0);
  });

  it("handles floating-point addition without drift", () => {
    // Classic 0.1 + 0.2 === 0.30000000000000004 — don't use toBe here.
    expect(add(0.1, 0.2)).toBeCloseTo(0.3);
  });
});

// =============================================================================
// 2. STRING ASSERTIONS AND ERROR PATHS — greet()
// =============================================================================

describe("greet", () => {
  it("greets a named user", () => {
    expect(greet("Morgan")).toBe("Hello, Morgan!");
  });

  it("includes the name in the result", () => {
    // toMatch is useful when you don't care about the exact string format.
    expect(greet("Alex")).toMatch(/Alex/);
  });

  it("throws when name is empty", () => {
    // Note the wrapper: toThrow needs a FUNCTION, not a value. If you call
    // greet("") directly inside expect(...), the error is thrown BEFORE
    // expect gets a chance to catch it.
    expect(() => greet("")).toThrow("name required");
  });

  it("throws an Error instance (not a string)", () => {
    expect(() => greet("")).toThrow(Error);
  });
});

// =============================================================================
// 3. ARRAY ASSERTIONS — uniq()
// =============================================================================

describe("uniq", () => {
  it("removes duplicate numbers", () => {
    // toEqual does deep equality — required for arrays/objects.
    expect(uniq([1, 1, 2, 3, 3])).toEqual([1, 2, 3]);
  });

  it("preserves first-seen order", () => {
    expect(uniq([3, 1, 2, 1, 3])).toEqual([3, 1, 2]);
  });

  it("works on an array of strings", () => {
    expect(uniq(["a", "b", "a", "c", "b"])).toEqual(["a", "b", "c"]);
  });

  it("returns an empty array for empty input", () => {
    expect(uniq([])).toEqual([]);
    expect(uniq([])).toHaveLength(0);
  });
});

// =============================================================================
// 4. OBJECT ASSERTIONS AND FIXTURES — isAdult()
// =============================================================================

describe("isAdult", () => {
  // Example of a fixture. In a bigger suite you might use beforeEach to set
  // these up fresh per test so mutations in one test don't leak into another.
  let adult: User;
  let minor: User;

  beforeEach(() => {
    adult = { id: "u1", name: "Morgan", age: 30 };
    minor = { id: "u2", name: "Sam", age: 10 };
  });

  it("returns true for a user over 18", () => {
    expect(isAdult(adult)).toBe(true);
  });

  it("returns false for a user under 18", () => {
    expect(isAdult(minor)).toBe(false);
  });

  it("returns true at the exact boundary of 18", () => {
    // Boundary tests catch off-by-one errors. Always write them.
    expect(isAdult({ ...adult, age: 18 })).toBe(true);
    expect(isAdult({ ...adult, age: 17 })).toBe(false);
  });

  it("the user object is untouched after the call", () => {
    const snapshot = { ...adult };
    isAdult(adult);
    expect(adult).toEqual(snapshot); // proves no mutation
  });
});

// =============================================================================
// 5. NESTED DESCRIBE BLOCKS
// =============================================================================

// You can nest describe for fine-grained grouping. Output reads nicely:
//   User
//     when adult
//       ✓ is flagged as adult
//     when minor
//       ✓ is flagged as not-adult

describe("User", () => {
  describe("when adult", () => {
    it("is flagged as adult", () => {
      expect(isAdult({ id: "u1", name: "x", age: 40 })).toBe(true);
    });
  });

  describe("when minor", () => {
    it("is flagged as not-adult", () => {
      expect(isAdult({ id: "u2", name: "y", age: 5 })).toBe(false);
    });
  });
});

// =============================================================================
// 6. .EACH — TABLE-DRIVEN TESTS
// =============================================================================

// For "same test, many inputs" — Python's @pytest.mark.parametrize.
// Avoids copy-pasting the same test body with different numbers.

describe("add (table-driven)", () => {
  it.each([
    { a: 0, b: 0, expected: 0 },
    { a: 1, b: 2, expected: 3 },
    { a: -5, b: 5, expected: 0 },
    { a: 100, b: 200, expected: 300 },
  ])("add($a, $b) = $expected", ({ a, b, expected }) => {
    // The $ placeholders get filled in the test name — nice output.
    expect(add(a, b)).toBe(expected);
  });
});

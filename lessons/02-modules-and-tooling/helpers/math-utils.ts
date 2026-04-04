// Helper module for Lesson 01: ES Modules
// This file demonstrates named exports, default exports, and type exports.

export function add(a: number, b: number): number {
  return a + b;
}

export function subtract(a: number, b: number): number {
  return a - b;
}

export function multiply(a: number, b: number): number {
  return a * b;
}

export const PI = 3.14159;

// Type-only export — erased at compile time
export type MathOperation = (a: number, b: number) => number;

// Helper module for Lesson 01: ES Modules
// Demonstrates a default export (one per file).

export default class Logger {
  constructor(private prefix: string) {}

  log(message: string): void {
    console.log(`[${this.prefix}] ${message}`);
  }

  warn(message: string): void {
    console.log(`[${this.prefix} WARN] ${message}`);
  }

  error(message: string): void {
    console.error(`[${this.prefix} ERROR] ${message}`);
  }
}

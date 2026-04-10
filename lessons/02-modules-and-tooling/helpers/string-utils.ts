export function capitalize(s: string): string {
  return s.toUpperCase();
}

export function reverse(s: string): string {
  return [...s].reverse().join("");
}

export type StringTransform = (s: string) => string;

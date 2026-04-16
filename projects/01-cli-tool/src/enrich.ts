import { type SensorReading, type EnrichedReading } from "./types.js";
import { setTimeout as delay } from "node:timers/promises";

class ApiError extends Error {
  constructor(message: string) {
    super(message);
  }
}

function randomChoice<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

const deviceNames = ["Device A", "Device B", "Device C", "Device D"] as const;
type DeviceName = (typeof deviceNames)[number];

const locations = ["Location A", "Location B", "Location C"] as const;
type Location = (typeof locations)[number];

async function withTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  ms: number,
): Promise<T> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(new Error(`Timed out after ${ms}ms`)), ms);
  try {
    return await operation(ac.signal);
  } finally {
    clearTimeout(timer); // clean up if operation finishes before timeout
  }
}

function getApiCallback(
  reading: SensorReading,
  delayMs: number,
): (signal: AbortSignal) => Promise<EnrichedReading> {
  return async (signal: AbortSignal) => {
    await delay(delayMs, undefined, { signal });
    if (Math.random() < 0.1) {
      throw new ApiError("10% failure error");
    }
    return {
      ...reading,
      deviceName: randomChoice(deviceNames),
      location: randomChoice(locations),
    };
  };
}

function getRandomDelay(delayRangeMs: [number, number]): number {
  const [min, max] = delayRangeMs;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function enrichReading(
  reading: SensorReading,
  timeout: number = 250,
  delayRangeMs: [number, number] = [50, 300],
): Promise<EnrichedReading> {
  try {
    const randomDelay = getRandomDelay(delayRangeMs);
    const apiCallback = getApiCallback(reading, randomDelay);
    const result = await withTimeout(apiCallback, timeout);
    return result;
  } catch (err) {
    const cause = err instanceof Error ? err : new Error(String(err));
    throw new Error("Error generating response from API", { cause });
  }
}

async function pool<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array<R>(items.length);
  let cursor = 0;

  async function run(): Promise<void> {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await worker(items[i]!);
    }
  }

  // Spin up `limit` workers; each pulls from the shared cursor.
  const workers = Array.from({ length: Math.min(limit, items.length) }, run);
  await Promise.allSettled(workers);
  return results;
}

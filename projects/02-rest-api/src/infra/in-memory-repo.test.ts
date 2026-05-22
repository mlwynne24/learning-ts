import { describe, it, expect } from "vitest";
import { InMemoryReadingRepository } from "./in-memory-repo.js";
import { SensorReading, StoredReading } from "../domain/reading.js";

// --- Factories for arranging test data ---

function makeSensorReading(overrides: Partial<SensorReading> = {}): SensorReading {
  return {
    deviceId: "device-a",
    timestamp: "2026-04-10T08:15:30Z",
    metric: "temperature",
    value: 20,
    ...overrides,
  };
}

function makeStoredReading(overrides: Partial<StoredReading> = {}): StoredReading {
  return {
    ...makeSensorReading(),
    id: "seed-id-" + Math.random().toString(36).slice(2, 10),
    receivedAt: "2026-04-10T08:16:00Z",
    ...overrides,
  };
}

// --- Harness: builds a repo with controllable fakes ---

function makeRepo(
  opts: {
    seed?: StoredReading[];
    now?: string;
    ids?: string[];
  } = {},
) {
  const fixedNow = opts.now ?? "2026-05-22T10:00:00.000Z";
  const idQueue = [...(opts.ids ?? ["test-id-1", "test-id-2", "test-id-3"])];

  const clock = () => fixedNow;
  const idGen = () => {
    const next = idQueue.shift();
    if (!next) throw new Error("makeRepo: ran out of fake ids — pass more in `ids`");
    return next;
  };

  return new InMemoryReadingRepository(opts.seed ?? [], clock, idGen);
}

describe("InMemoryReadingRepository", () => {
  it("returns a stored reading with the input fields plus id and receivedAt", async () => {
    const repo = makeRepo({ now: "2026-05-22T10:00:00.000Z", ids: ["uuid-1"] });
    const stored = await repo.insert(makeSensorReading());

    expect(stored).toEqual({
      ...makeSensorReading(),
      id: "uuid-1",
      receivedAt: "2026-05-22T10:00:00.000Z",
    });
  });
});

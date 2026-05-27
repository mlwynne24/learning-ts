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
    nows?: string[];
    ids?: string[];
  } = {},
) {
  const nowQueue = [...(opts.nows ?? ["2026-05-22T10:00:00.000Z"])];
  const idQueue = [...(opts.ids ?? ["test-id-1", "test-id-2", "test-id-3"])];

  const clock = () => {
    return nowQueue.length > 1 ? nowQueue.shift()! : nowQueue[0];
  };
  const idGen = () => {
    const next = idQueue.shift();
    if (!next) throw new Error("makeRepo: ran out of fake ids — pass more in `ids`");
    return next;
  };

  return new InMemoryReadingRepository(opts.seed ?? [], clock, idGen);
}

describe("InMemoryReadingRepository insert()", () => {
  it("returns a stored reading with the input fields plus id and receivedAt", async () => {
    const repo = makeRepo({ nows: ["2026-05-22T10:00:00.000Z"], ids: ["uuid-1"] });
    const stored = await repo.insert(makeSensorReading());

    expect(stored).toEqual({
      ...makeSensorReading(),
      id: "uuid-1",
      receivedAt: "2026-05-22T10:00:00.000Z",
    });
  });

  it("appends the stored reading to readings", async () => {
    const newId = "uuid-1";
    const now = "2026-05-22T10:00:00.000Z";
    const repo = makeRepo({ nows: [now], ids: [newId] });
    const newStored = await repo.insert(makeSensorReading());

    expect(repo.readings).toHaveLength(1);
    expect(repo.readings.at(-1)).toEqual(makeStoredReading({ id: newId, receivedAt: now }));
  });

  it("generates a fresh id and receivedAt per call across multiple inserts", async () => {
    const repo = makeRepo({
      nows: ["2026-05-22T10:00:00.000Z", "2026-06-22T10:00:00.000Z"],
      ids: ["uuid-1", "uuid-2"],
    });
    await repo.insert(makeSensorReading());
    await repo.insert(makeSensorReading());

    expect(repo.readings).toEqual([
      expect.objectContaining({ id: "uuid-1", receivedAt: "2026-05-22T10:00:00.000Z" }),
      expect.objectContaining({ id: "uuid-2", receivedAt: "2026-06-22T10:00:00.000Z" }),
    ]);
  });

  it("Does not mutate the caller's input object", async () => {
    const repo = makeRepo({ ids: ["uuid-1"] });

    const input = makeSensorReading();
    const snapshot = structuredClone(input);

    await repo.insert(input);

    expect(input).toEqual(snapshot);
  });

  it("preserves insertion order in readings", async () => {
    const initReading = makeStoredReading({ id: "uuid-1" });
    const repo = makeRepo({ seed: [initReading], ids: ["uuid-2"] });
    await repo.insert(makeSensorReading());

    expect(repo.readings.at(0)).toBe(initReading);
    expect(repo.readings.at(-1)?.id).toBe("uuid-2");
  });
});

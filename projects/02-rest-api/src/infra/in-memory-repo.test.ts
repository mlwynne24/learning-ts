import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryReadingRepository } from "./in-memory-repo.js"
import { SensorReading, StoredReading } from "../domain/reading.js";

describe("InMemoryReadingRepository", () => {
  let Repository: InMemoryReadingRepository
  let testSensorReading: SensorReading
  let testStoredReadings: Array<StoredReading>

  beforeEach(() => {
    testSensorReading = {
      deviceId: "3",
      timestamp: "2026-06-10T08:15:30Z",
      metric: "humidity",
      value: 200
    }
    testStoredReadings = [
      {
        deviceId: "2",
        timestamp: "2026-04-10T08:15:30Z",
        metric: "temperature",
        value: 99,
        id: "145632asf4",
        receivedAt: "2026-04-10T08:16:45Z",
      }
    ]
    Repository = new InMemoryReadingRepository(testStoredReadings)
  })

  it("stores new readings with insert()", async () => {
    const storedReading = await Repository.insert(testSensorReading)
    expect(Repository.readings).toHaveLength(2)
    // expect(Repository.readings[-1]).toBe()
  })
})
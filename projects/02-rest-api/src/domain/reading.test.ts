import { describe, it, expect, beforeEach } from "vitest";
import {
  type SensorReading,
  type StoredReading,
  SensorReadingSchema,
  StoredReadingSchema,
} from "./reading.js";

describe("SensorReading", () => {
  let validSensor: SensorReading;
  let validSensorStored: StoredReading;

  beforeEach(() => {
    validSensor = {
      deviceId: "2",
      timestamp: "2026-04-10T08:15:30Z",
      metric: "temperature",
      value: 99,
    };
    validSensorStored = {
      ...validSensor,
      id: "145632asf4",
      receivedAt: "2026-04-10T08:16:45Z",
    };
  });

  it("passes a known valid sensor reading", () => {
    expect(SensorReadingSchema.safeParse(validSensor).success).toBe(true);
    expect(StoredReadingSchema.safeParse(validSensorStored).success).toBe(true);
  });
});

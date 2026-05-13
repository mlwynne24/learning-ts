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

  it("accepts a known valid sensor reading", () => {
    expect(SensorReadingSchema.safeParse(validSensor).success).toBe(true);
  });

  it("accepts a known valid stored reading", () => {
    expect(StoredReadingSchema.safeParse(validSensorStored).success).toBe(true);
  });

  it("coerces a string value to a number", () => {
    expect(SensorReadingSchema.safeParse({ ...validSensor, value: "99" }).success).toBe(true);
  });

  it("rejects an empty deviceId", () => {
    expect(SensorReadingSchema.safeParse({ ...validSensor, deviceId: "" }).success).toBe(false);
  });

  it("accepts value at the -100 and 1000 boundaries", () => {
    expect(SensorReadingSchema.safeParse({ ...validSensor, value: -100 }).success).toBe(true);
    expect(SensorReadingSchema.safeParse({ ...validSensor, value: 1000 }).success).toBe(true);
  });

  it("rejects value outside the -100 to 1000 range", () => {
    expect(SensorReadingSchema.safeParse({ ...validSensor, value: -101 }).success).toBe(false);
    expect(SensorReadingSchema.safeParse({ ...validSensor, value: 1001 }).success).toBe(false);
  });

  it("rejects values that cannot be coerced to a number", () => {
    expect(SensorReadingSchema.safeParse({ ...validSensor, value: "hot" }).success).toBe(false);
  });

  it("rejects an unknown metric", () => {
    expect(SensorReadingSchema.safeParse({ ...validSensor, metric: "voltage" }).success).toBe(false);
  });

  it("rejects a non-ISO timestamp", () => {
    expect(
      SensorReadingSchema.safeParse({ ...validSensor, timestamp: "2026-04-10 08:15:30" }).success,
    ).toBe(false);
  });

  it("requires id and receivedAt on a stored reading", () => {
    const { id: _id, ...withoutId } = validSensorStored;
    expect(StoredReadingSchema.safeParse(withoutId).success).toBe(false);

    const { receivedAt: _receivedAt, ...withoutReceivedAt } = validSensorStored;
    expect(StoredReadingSchema.safeParse(withoutReceivedAt).success).toBe(false);
  });

  it("rejects a non-ISO receivedAt on a stored reading", () => {
    expect(
      StoredReadingSchema.safeParse({ ...validSensorStored, receivedAt: "yesterday" }).success,
    ).toBe(false);
  });
});

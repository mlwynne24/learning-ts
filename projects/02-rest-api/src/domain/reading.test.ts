import { describe, it, expect, beforeEach } from "vitest";
import {
  type SensorReading,
  type StoredReading,
  type ReadingFilter,
  SensorReadingSchema,
  StoredReadingSchema,
  ReadingFilterSchema,
} from "./reading.js";

describe("SensorReadingSchema", () => {
  let validSensor: SensorReading;

  beforeEach(() => {
    validSensor = {
      deviceId: "2",
      timestamp: "2026-04-10T08:15:30Z",
      metric: "temperature",
      value: 99,
    };
  });

  it("accepts a known valid sensor reading", () => {
    expect(SensorReadingSchema.safeParse(validSensor).success).toBe(true);
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
    expect(SensorReadingSchema.safeParse({ ...validSensor, metric: "voltage" }).success).toBe(
      false,
    );
  });

  it("rejects a non-ISO timestamp", () => {
    expect(
      SensorReadingSchema.safeParse({ ...validSensor, timestamp: "2026-04-10 08:15:30" }).success,
    ).toBe(false);
  });
});

describe("StoredReadingSchema", () => {
  let validSensorStored: StoredReading;

  beforeEach(() => {
    validSensorStored = {
      deviceId: "2",
      timestamp: "2026-04-10T08:15:30Z",
      metric: "temperature",
      value: 99,
      id: "145632asf4",
      receivedAt: "2026-04-10T08:16:45Z",
    };
  });

  it("accepts a known valid stored reading", () => {
    expect(StoredReadingSchema.safeParse(validSensorStored).success).toBe(true);
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

describe("ReadingFilter", () => {
  let validReadingFilter: ReadingFilter;

  beforeEach(() => {
    validReadingFilter = {
      deviceId: "2",
      metric: "temperature",
      since: "2026-04-01T09:00:00Z",
      until: "2026-10-01T09:00:00Z",
      limit: 200,
      offset: 2,
    };
  });

  it("accepts a known valid reading filter", () => {
    expect(ReadingFilterSchema.safeParse(validReadingFilter).success).toBe(true);
  });

  it("limit and offset are not required and default to correct values", () => {
    const { limit: _limit, offset: _offset, ...withoutDefaultFields } = validReadingFilter;
    const parsedReadingFilter = ReadingFilterSchema.safeParse(withoutDefaultFields);
    expect(parsedReadingFilter.success).toBe(true);
    expect(parsedReadingFilter.data?.offset).toBe(0);
    expect(parsedReadingFilter.data?.limit).toBe(50);
  });

  it("accepts limit at the 1 and 500 boundaries", () => {
    expect(ReadingFilterSchema.safeParse({ ...validReadingFilter, limit: 1 }).success).toBe(true);
    expect(ReadingFilterSchema.safeParse({ ...validReadingFilter, limit: 500 }).success).toBe(true);
  });

  it("rejects negative values for offset", () => {
    expect(ReadingFilterSchema.safeParse({ ...validReadingFilter, offset: -1 }).success).toBe(
      false,
    );
  });

  it("rejects float values for limit and offset", () => {
    expect(ReadingFilterSchema.safeParse({ ...validReadingFilter, limit: 1.1 }).success).toBe(
      false,
    );
    expect(ReadingFilterSchema.safeParse({ ...validReadingFilter, offset: 5.67 }).success).toBe(
      false,
    );
  });
});

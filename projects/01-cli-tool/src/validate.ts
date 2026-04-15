import {
  SensorReading,
  EnrichedReading,
  type SensorReading as SR,
  type EnrichedReading as ER,
} from "./types.js";

type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

type Reading = SR | ER;

type ReadingValidator = typeof SensorReading | typeof EnrichedReading;

async function validateSensorReading(
  sensorReading: object,
  object: ReadingValidator,
): Promise<Result<Reading>> {
  try {
    const result = await object.parse(sensorReading);
    return { ok: true, value: result };
  } catch (err) {
    const cause = err instanceof Error ? err : new Error(String(err));
    return { ok: false, error: new Error("Validation of sensor reading failed", { cause }) };
  }
}

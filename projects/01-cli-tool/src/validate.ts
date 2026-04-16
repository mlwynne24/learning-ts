import { SensorReading, type SensorReading as SR } from "./types.js";

export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

async function validateSensorReading(
  sensorReading: unknown,
  object: typeof SensorReading,
): Promise<Result<SR>> {
  try {
    const result = await object.parse(sensorReading);
    return { ok: true, value: result };
  } catch (err) {
    const cause = err instanceof Error ? err : new Error(String(err));
    return { ok: false, error: new Error("Validation of sensor reading failed", { cause }) };
  }
}

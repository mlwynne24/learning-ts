import { SensorReading, type SensorReading as SR, type Result } from "./types.js";

export function validateSensorReading(sensorReading: unknown): Result<SR> {
  try {
    const parsed = SensorReading.parse(sensorReading);
    return { ok: true, value: parsed };
  } catch (err) {
    const cause = err instanceof Error ? err : new Error(String(err));
    return { ok: false, error: new Error("Validation of sensor reading failed", { cause }) };
  }
}

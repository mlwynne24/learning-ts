import { z } from "zod";

export const SensorReading = z.object({
  deviceId: z.string().min(1),
  timestamp: z.iso.datetime(),
  metric: z.enum(["temperature", "humidity", "pressure"]),
  value: z.coerce.number().min(-100).max(1000),
});

export type SensorReading = z.infer<typeof SensorReading>;

export const EnrichedReading = z.object({
  ...SensorReading.shape,
  deviceName: z.string(),
  location: z.string(),
});

export type EnrichedReading = z.infer<typeof EnrichedReading>;

export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

import { z } from "zod";

export const SensorReadingSchema = z.object({
  deviceId: z.string().min(1),
  timestamp: z.iso.datetime(),
  metric: z.enum(["temperature", "humidity", "pressure"]),
  value: z.coerce.number().min(-100).max(1000),
});

export const StoredReadingSchema = SensorReadingSchema.extend({
  id: z.string(),
  receivedAt: z.iso.datetime(),
});

export type SensorReading = z.infer<typeof SensorReadingSchema>;
export type StoredReading = z.infer<typeof StoredReadingSchema>;

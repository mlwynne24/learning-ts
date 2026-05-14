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

export const ReadingFilterSchema = z.object({
  deviceId: z.string().min(1),
  metric: z.enum(["temperature", "humidity", "pressure"]),
  since: z.iso.datetime(),
  until: z.iso.datetime(),
  limit: z.int().min(1).max(500).default(50),
  offset: z.int().min(0).default(0),
});

export type SensorReading = z.infer<typeof SensorReadingSchema>;
export type StoredReading = z.infer<typeof StoredReadingSchema>;
export type ReadingFilter = z.infer<typeof ReadingFilterSchema>;

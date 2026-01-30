import { z } from "zod";
import { LOG_LEVELS, LogLevel } from "../types/log.types.js";

export const createLogSchema = z.object({
  timestamp: z.string().datetime().optional(),
  level: z.enum(LOG_LEVELS as [LogLevel, ...LogLevel[]]),
  message: z.string().min(1).max(10000),
  source: z.string().min(1).max(255),
  labels: z.record(z.string()).optional(),
  metadata: z.record(z.number()).optional(),
  raw: z.string().optional(),
});

export const logQuerySchema = z.object({
  query: z.string().optional(),
  levels: z.string().optional(),
  sources: z.string().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  limit: z.string().regex(/^\d+$/).optional(),
  offset: z.string().regex(/^\d+$/).optional(),
});

export const logIdSchema = z.object({
  id: z.string().min(1),
});

export type CreateLogInput = z.infer<typeof createLogSchema>;
export type LogQueryInput = z.infer<typeof logQuerySchema>;
export type LogIdInput = z.infer<typeof logIdSchema>;

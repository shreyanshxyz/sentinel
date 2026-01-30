export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  source: string;
  labels: Record<string, string>;
  metadata?: Record<string, number>;
  raw?: string;
}

export interface LogFilter {
  query?: string;
  levels?: LogLevel[];
  sources?: string[];
  labels?: Record<string, string>;
  startTime?: string;
  endTime?: string;
  limit?: number;
  offset?: number;
}

export interface LogSource {
  id: string;
  name: string;
  type: "file" | "syslog" | "api" | "database";
  status: "active" | "inactive" | "error";
  config: Record<string, string>;
  lastSeen?: string;
}

export interface CreateLogInput {
  timestamp?: string;
  level: LogLevel;
  message: string;
  source: string;
  labels?: Record<string, string>;
  metadata?: Record<string, number>;
  raw?: string;
}

export const LOG_LEVELS: LogLevel[] = [
  "DEBUG",
  "INFO",
  "WARN",
  "ERROR",
  "FATAL",
];

export const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4,
};

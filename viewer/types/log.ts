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

export interface LogAnalysis {
  id: string;
  logId: string;
  summary: string;
  severity: "low" | "medium" | "high" | "critical";
  suggestions: string[];
  relatedLogs: string[];
  patterns: string[];
  createdAt: string;
}

export interface AIInsight {
  id: string;
  logId: string;
  summary: string;
  rootCause: string;
  followUps: FollowUpAction[];
  severity: "low" | "medium" | "high" | "critical";
  confidence: number;
  patterns: string[];
  relatedLogs: string[];
  createdAt: string;
  status: "pending" | "completed" | "failed";
  modelVersion?: string;
  anomalyScore?: number;
}

export interface FollowUpAction {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  type: "investigation" | "fix" | "monitor" | "documentation";
}

export interface LogSource {
  id: string;
  name: string;
  type: "file" | "syslog" | "api" | "database";
  status: "active" | "inactive" | "error";
  config: Record<string, string>;
  lastSeen?: string;
}

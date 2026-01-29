import { LogEntry } from "./log";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
    totalPages: number;
  };
}

export interface SearchResponse extends PaginatedResponse<LogEntry> {
  facets?: {
    levels: Record<string, number>;
    sources: Record<string, number>;
    labels: Record<string, Record<string, number>>;
  };
}

export interface StreamResponse {
  type: "log" | "status" | "error";
  data: LogEntry | string;
  timestamp: string;
}

export interface HealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  version: string;
  uptime: number;
  sources: {
    total: number;
    active: number;
    errors: number;
  };
  metrics: {
    logsPerSecond: number;
    totalLogs: number;
    storageUsed: number;
  };
}

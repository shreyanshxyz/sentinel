import { LogEntry } from "./log.types.js";

export interface ApiError {
  code: string;
  message: string;
  details?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ResponseMeta {
  total?: number;
  page?: number;
  limit?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
  totalPages?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: Required<ResponseMeta>;
}

export interface SearchResponse extends PaginatedResponse<LogEntry> {
  facets?: {
    levels: Record<string, number>;
    sources: Record<string, number>;
    labels: Record<string, Record<string, number>>;
  };
}

export interface StreamResponse {
  type: "log" | "status" | "error" | "heartbeat";
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

export interface LogQueryParams {
  query?: string;
  levels?: string;
  sources?: string;
  startTime?: string;
  endTime?: string;
  limit?: string;
  offset?: string;
}

export class ApiException extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number,
    public readonly details?: string,
  ) {
    super(message);
    this.name = "ApiException";
  }
}

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from "axios";
import { ApiResponse, HealthResponse, SearchResponse } from "@/types/api";
import { LogEntry, LogFilter, AIInsight, LogSource } from "@/types/log";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

class APIError extends Error {
  constructor(
    message: string,
    public code: string,
    public status?: number,
    public details?: string,
  ) {
    super(message);
    this.name = "APIError";
  }
}

class APIClient {
  private client: AxiosInstance;
  private retryCount: number = 0;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const config = error.config as AxiosRequestConfig & {
          retryCount?: number;
        };

        if (!config) return Promise.reject(error);

        config.retryCount = config.retryCount || 0;

        if (
          config.retryCount < MAX_RETRIES &&
          (error.code === "ECONNABORTED" ||
            error.code === "ETIMEDOUT" ||
            error.response?.status === 429 ||
            (error.response?.status && error.response.status >= 500))
        ) {
          config.retryCount++;
          const delay = RETRY_DELAY * Math.pow(2, config.retryCount - 1);

          console.log(
            `Retrying request (attempt ${config.retryCount}/${MAX_RETRIES}) after ${delay}ms`,
          );

          await new Promise((resolve) => setTimeout(resolve, delay));
          return this.client(config);
        }

        return Promise.reject(this.handleError(error));
      },
    );
  }

  private handleError(error: AxiosError): APIError {
    if (error.response?.data) {
      const data = error.response.data as ApiResponse<unknown>;
      return new APIError(
        data.error?.message || "Unknown error",
        data.error?.code || "UNKNOWN_ERROR",
        error.response.status,
        data.error?.details,
      );
    }

    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      return new APIError(
        "Request timeout. Please check your connection.",
        "TIMEOUT",
        408,
      );
    }

    if (error.code === "ERR_NETWORK") {
      return new APIError(
        "Network error. Please check if the API server is running.",
        "NETWORK_ERROR",
        503,
      );
    }

    return new APIError(
      error.message || "An unexpected error occurred",
      "UNKNOWN_ERROR",
      error.response?.status,
    );
  }

  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    const response = await this.client.get<ApiResponse<T>>(endpoint, {
      params,
    });

    if (!response.data.success) {
      throw new APIError(
        response.data.error?.message || "Request failed",
        response.data.error?.code || "REQUEST_FAILED",
        undefined,
        response.data.error?.details,
      );
    }

    return response.data.data as T;
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(endpoint, data);

    if (!response.data.success) {
      throw new APIError(
        response.data.error?.message || "Request failed",
        response.data.error?.code || "REQUEST_FAILED",
      );
    }

    return response.data.data as T;
  }

  async getLogs(filter?: LogFilter): Promise<LogEntry[]> {
    const params: Record<string, unknown> = {};

    if (filter?.query) params.query = filter.query;
    if (filter?.levels?.length) params.levels = filter.levels.join(",");
    if (filter?.sources?.length) params.sources = filter.sources.join(",");
    if (filter?.startTime) params.startTime = filter.startTime;
    if (filter?.endTime) params.endTime = filter.endTime;
    if (filter?.limit) params.limit = filter.limit;
    if (filter?.offset) params.offset = filter.offset;

    return this.get<LogEntry[]>("/logs", params);
  }

  async getLogById(id: string): Promise<LogEntry> {
    return this.get<LogEntry>(`/logs/${id}`);
  }

  async searchLogs(filter: LogFilter): Promise<SearchResponse> {
    const params: Record<string, unknown> = {};

    if (filter.query) params.query = filter.query;
    if (filter.levels?.length) params.levels = filter.levels.join(",");
    if (filter.sources?.length) params.sources = filter.sources.join(",");
    if (filter.startTime) params.startTime = filter.startTime;
    if (filter.endTime) params.endTime = filter.endTime;
    if (filter.limit) params.limit = filter.limit;
    if (filter.offset) params.offset = filter.offset;

    const response = await this.client.get<SearchResponse>("/logs", { params });

    if (!response.data.success) {
      throw new APIError(
        response.data.error?.message || "Search failed",
        response.data.error?.code || "SEARCH_FAILED",
      );
    }

    return response.data;
  }

  async getLogAnalysis(logId: string): Promise<AIInsight | null> {
    try {
      return await this.get<AIInsight>(`/logs/${logId}/analysis`);
    } catch (error) {
      if (error instanceof APIError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async triggerAnalysis(logId: string): Promise<AIInsight> {
    return this.post<AIInsight>(`/logs/${logId}/analyze`);
  }

  async getSources(): Promise<LogSource[]> {
    return this.get<LogSource[]>("/sources");
  }

  async getHealth(): Promise<HealthResponse> {
    return this.get<HealthResponse>("/health");
  }

  async getAnalytics(timeRange: string): Promise<{
    total: number;
    byLevel: Record<string, number>;
    bySource: Record<string, number>;
  }> {
    const logs = await this.getLogs({
      startTime: this.getStartTimeForRange(timeRange),
    });

    const byLevel: Record<string, number> = {};
    const bySource: Record<string, number> = {};

    logs.forEach((log) => {
      byLevel[log.level] = (byLevel[log.level] || 0) + 1;
      bySource[log.source] = (bySource[log.source] || 0) + 1;
    });

    return {
      total: logs.length,
      byLevel,
      bySource,
    };
  }

  private getStartTimeForRange(range: string): string {
    const now = new Date();
    const hours = parseInt(range);

    if (!isNaN(hours)) {
      return new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();
    }

    return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  }
}

export const apiClient = new APIClient();
export { APIError };

export async function checkAPIHealth(timeout = 5000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

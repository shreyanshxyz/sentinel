import { config } from "dotenv";

config();

export interface ServerConfig {
  port: number;
  host: string;
  env: "development" | "production" | "test";
  corsOrigins: string[];
  maxRequestSize: string;
  rateLimitWindowMs: number;
  rateLimitMax: number;
}

export interface LogConfig {
  maxLogsInMemory: number;
  defaultPageSize: number;
  maxPageSize: number;
  sseHeartbeatIntervalMs: number;
}

export interface AppConfig {
  server: ServerConfig;
  log: LogConfig;
  version: string;
}

const parseCorsOrigins = (origins: string | undefined): string[] => {
  if (!origins) return ["http://localhost:3000"];
  return origins.split(",").map((o) => o.trim());
};

const getEnv = (key: string, defaultValue: string): string => {
  return process.env[key] ?? defaultValue;
};

const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

export const appConfig: AppConfig = {
  server: {
    port: getEnvNumber("PORT", 8000),
    host: getEnv("HOST", "0.0.0.0"),
    env: getEnv("NODE_ENV", "development") as AppConfig["server"]["env"],
    corsOrigins: parseCorsOrigins(process.env["CORS_ORIGINS"]),
    maxRequestSize: getEnv("MAX_REQUEST_SIZE", "10mb"),
    rateLimitWindowMs: getEnvNumber("RATE_LIMIT_WINDOW_MS", 60000),
    rateLimitMax: getEnvNumber("RATE_LIMIT_MAX", 100),
  },
  log: {
    maxLogsInMemory: getEnvNumber("MAX_LOGS_IN_MEMORY", 10000),
    defaultPageSize: getEnvNumber("DEFAULT_PAGE_SIZE", 20),
    maxPageSize: getEnvNumber("MAX_PAGE_SIZE", 100),
    sseHeartbeatIntervalMs: getEnvNumber("SSE_HEARTBEAT_INTERVAL_MS", 30000),
  },
  version: getEnv("APP_VERSION", "1.0.0"),
};

export const isDevelopment = (): boolean =>
  appConfig.server.env === "development";
export const isProduction = (): boolean =>
  appConfig.server.env === "production";

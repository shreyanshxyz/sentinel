import winston from "winston";
import { isDevelopment } from "../config/index.js";

const { combine, timestamp, json, printf, colorize } = winston.format;

const devFormat = printf((info: winston.Logform.TransformableInfo) => {
  const { level, message, timestamp, ...metadata } = info;
  const levelStr = String(level ?? "info");
  const messageStr = String(message ?? "");
  const timestampStr = timestamp ? String(timestamp) : new Date().toISOString();
  let msg = `${timestampStr} [${levelStr}]: ${messageStr}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

export const logger = winston.createLogger({
  level: isDevelopment() ? "debug" : "info",
  defaultMeta: { service: "sentinel-api" },
  transports: [
    new winston.transports.Console({
      format: isDevelopment()
        ? combine(colorize(), timestamp(), devFormat)
        : combine(timestamp(), json()),
    }),
  ],
});

export const httpLogger = winston.createLogger({
  level: "info",
  defaultMeta: { service: "sentinel-api-http" },
  transports: [
    new winston.transports.Console({
      format: combine(timestamp(), json()),
    }),
  ],
});

import { appConfig } from "../config/index.js";
import { createLogSchema } from "../validation/log.schema.js";
import { logService } from "./log.service.js";
import { streamService } from "./stream.service.js";
import { logger } from "../utils/logger.js";
import { LogLevel } from "../types/log.types.js";

interface DemoTemplate {
  level: LogLevel;
  source: string;
  message: string;
}

const LABELS = { environment: "production", region: "us-west-2" };

const TEMPLATES: DemoTemplate[] = [
  { level: "DEBUG", source: "worker-service", message: "Job queue drained in 42ms" },
  { level: "DEBUG", source: "api-gateway", message: "Route cache hit for GET /v1/orders" },
  { level: "INFO", source: "auth-service", message: "Session refreshed" },
  { level: "INFO", source: "notifications-service", message: "Email batch delivered" },
  { level: "INFO", source: "inventory-service", message: "Stock reconciliation finished" },
  { level: "INFO", source: "checkout-service", message: "Cart priced" },
  { level: "WARN", source: "api-gateway", message: "Rate limit reached for client" },
  {
    level: "WARN",
    source: "inventory-service",
    message: "Stock level below reorder point for SKU-1184",
  },
  {
    level: "WARN",
    source: "checkout-service",
    message: "Payment provider latency above threshold",
  },
  {
    level: "ERROR",
    source: "payment-service",
    message: "Database connection failed: timeout after 5000ms",
  },
  {
    level: "ERROR",
    source: "shipping-service",
    message: "Carrier API returned 503, retrying shipment batch",
  },
  {
    level: "ERROR",
    source: "auth-service",
    message: "Token validation failed: signature mismatch",
  },
  {
    level: "FATAL",
    source: "worker-service",
    message: "Out of memory while processing job batch",
  },
];

class DemoSeeder {
  private timer: NodeJS.Timeout | null = null;
  private inFlight = false;
  private index = 0;

  async start(): Promise<void> {
    if (this.timer) return;

    const intervalMs = appConfig.demo.seedIntervalMs;
    logger.info("Demo seeder started", { intervalMs });

    void this.tick();
    this.timer = setInterval(() => {
      void this.tick();
    }, intervalMs);
  }

  stop(): void {
    if (!this.timer) return;

    clearInterval(this.timer);
    this.timer = null;
    logger.info("Demo seeder stopped");
  }

  private async tick(): Promise<void> {
    if (this.inFlight) return;
    this.inFlight = true;

    try {
      const template = TEMPLATES[this.index % TEMPLATES.length];
      this.index += 1;

      const input = createLogSchema.parse({
        ...template,
        labels: LABELS,
        metadata: { durationMs: 120 + (this.index % 8) * 35 },
      });

      const log = await logService.create(input);
      streamService.broadcastLog(log);
    } catch (error) {
      logger.warn("Demo seed failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      this.inFlight = false;
    }
  }
}

export const demoSeeder = new DemoSeeder();

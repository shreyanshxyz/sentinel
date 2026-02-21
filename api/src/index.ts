import app from "./app.js";
import { appConfig } from "./config/index.js";
import { logger } from "./utils/logger.js";
import { 
  checkDatabaseConnection, 
  closeDatabaseConnection 
} from "./db/index.js";

const PORT = appConfig.server.port;
const HOST = appConfig.server.host;

let server: ReturnType<typeof app.listen> | null = null;

async function bootstrap() {
  logger.info("Starting Sentinel API...");
  logger.info(`Environment: ${appConfig.server.env}`);

  logger.info("Checking database connection...");
  const dbConnected = await checkDatabaseConnection();
  
  if (!dbConnected) {
    logger.error("Failed to connect to database. Exiting...");
    process.exit(1);
  }
  
  logger.info("Database connection established");

  server = app.listen(PORT, HOST, () => {
    logger.info(`Server running on http://${HOST}:${PORT}`);
    logger.info(`API documentation: http://${HOST}:${PORT}/api`);
  });
}

async function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}, shutting down gracefully...`);

  if (server) {
    await new Promise<void>((resolve) => {
      server!.close(() => {
        logger.info("HTTP server closed");
        resolve();
      });

      setTimeout(() => {
        logger.error("Forced shutdown after timeout");
        process.exit(1);
      }, 5000);
    });
  }

  try {
    await closeDatabaseConnection();
    logger.info("Database connection closed");
  } catch (error) {
    logger.error("Error closing database connection", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  process.exit(0);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled rejection", { 
    reason: reason instanceof Error ? reason.message : String(reason) 
  });
  process.exit(1);
});

bootstrap().catch((error) => {
  logger.error("Failed to start server", {
    error: error instanceof Error ? error.message : "Unknown error",
  });
  process.exit(1);
});

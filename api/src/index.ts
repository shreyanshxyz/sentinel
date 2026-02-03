import app from "./app.js";
import { appConfig } from "./config/index.js";
import { logger } from "./utils/logger.js";

const PORT = appConfig.server.port;
const HOST = appConfig.server.host;

let server: ReturnType<typeof app.listen> | null = null;

async function gracefulShutdown(signal: string) {
  if (server) {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    
    server.close(() => {
      logger.info("HTTP server closed");
      process.exit(0);
    });

    setTimeout(() => {
      logger.error("Forced shutdown after timeout");
      process.exit(1);
    }, 5000);
  } else {
    process.exit(0);
  }
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

server = app.listen(PORT, HOST, () => {
  logger.info(`Server running on http://${HOST}:${PORT}`);
  logger.info(`Environment: ${appConfig.server.env}`);
});

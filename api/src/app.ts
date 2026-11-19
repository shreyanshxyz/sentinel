import express from "express";
import cors from "cors";
import helmet from "helmet";
import routes from "./routes/index.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/error.middleware.js";
import { requestLogger } from "./middleware/logger.middleware.js";
import { appConfig } from "./config/index.js";
import { streamService } from "./services/stream.service.js";
import { demoSeeder } from "./services/demo-seeder.service.js";
import { logger } from "./utils/logger.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: appConfig.server.corsOrigins,
    credentials: true,
  }),
);
app.use(express.json({ limit: appConfig.server.maxRequestSize }));
app.use(
  express.urlencoded({
    extended: true,
    limit: appConfig.server.maxRequestSize,
  }),
);
app.use(requestLogger);

app.get("/", (_req, res) => {
  res.json({
    success: true,
    data: {
      name: "Sentinel API",
      version: appConfig.version,
      status: "running",
    },
  });
});

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

streamService.start();

if (appConfig.demo.seed) {
  void demoSeeder.start();
}

process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  demoSeeder.stop();
  streamService.stop();
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully");
  demoSeeder.stop();
  streamService.stop();
  process.exit(0);
});

export default app;

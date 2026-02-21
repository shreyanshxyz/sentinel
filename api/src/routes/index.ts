import { Router } from "express";
import logRoutes from "./log.routes.js";
import { getHealth } from "../controllers/health.controller.js";
import { getSources } from "../controllers/log.controller.js";
import {
  getAnalytics,
  getHourlyStats,
  getTimeSeries,
} from "../controllers/analytics.controller.js";

const router = Router();

router.get("/health", getHealth);
router.get("/sources", getSources);
router.get("/analytics", getAnalytics);
router.get("/analytics/hourly", getHourlyStats);
router.get("/analytics/timeseries", getTimeSeries);
router.use("/logs", logRoutes);

export default router;

import { Router } from "express";
import logRoutes from "./log.routes.js";
import { getHealth } from "../controllers/health.controller.js";
import { getSources } from "../controllers/log.controller.js";

const router = Router();

router.get("/health", getHealth);
router.get("/sources", getSources);
router.use("/logs", logRoutes);

export default router;

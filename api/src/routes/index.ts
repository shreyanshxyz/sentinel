import { Router } from "express";
import logRoutes from "./log.routes.js";
import { getHealth } from "../controllers/health.controller.js";

const router = Router();

router.get("/health", getHealth);
router.use("/logs", logRoutes);

export default router;

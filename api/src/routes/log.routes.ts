import { Router } from "express";
import {
  ingestLog,
  getLogs,
  getLogById,
  streamLogs,
} from "../controllers/log.controller.js";
import {
  getLogAnalysis,
  triggerAnalysis,
  storeAnalysis,
  getPendingLogs,
  getAnalysisStats,
  getCriticalAnalyses,
  streamAnalysis,
} from "../controllers/ai.controller.js";

const router = Router();

router.post("/", ingestLog);
router.get("/", getLogs);
router.get("/live", streamLogs);
router.get("/:id", getLogById);

router.get("/:id/analysis", getLogAnalysis);

router.get("/:id/analyze-stream", streamAnalysis);

router.post("/:id/analyze", triggerAnalysis);

router.get("/analysis/pending", getPendingLogs);

router.post("/analysis", storeAnalysis);

router.get("/analysis/stats", getAnalysisStats);

router.get("/analysis/critical", getCriticalAnalyses);

export default router;

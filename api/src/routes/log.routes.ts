import { Router } from "express";
import {
  ingestLog,
  getLogs,
  getLogById,
  streamLogs,
} from "../controllers/log.controller.js";

const router = Router();

router.post("/", ingestLog);
router.get("/", getLogs);
router.get("/live", streamLogs);
router.get("/:id", getLogById);

export default router;

import { Request, Response, NextFunction } from "express";
import { aiService } from "../services/ai.service.js";
import { logService } from "../services/log.service.js";
import { ApiResponse, ApiException } from "../types/api.types.js";
import { AIAnalysis, LogEntry } from "../types/log.types.js";
import { logger } from "../utils/logger.js";
import { v4 as uuidv4 } from "uuid";

export const getLogAnalysis = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    const log = await logService.getById(id);
    if (!log) {
      throw new ApiException("NOT_FOUND", `Log with id '${id}' not found`, 404);
    }

    const analysis = await aiService.getAnalysis(id);

    if (!analysis) {
      throw new ApiException(
        "ANALYSIS_NOT_FOUND",
        `No AI analysis found for log '${id}'. Trigger analysis with POST /logs/${id}/analyze`,
        404,
      );
    }

    const response: ApiResponse<AIAnalysis> = {
      success: true,
      data: analysis,
    };

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

export const triggerAnalysis = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    const log = await logService.getById(id);
    if (!log) {
      throw new ApiException("NOT_FOUND", `Log with id '${id}' not found`, 404);
    }

    const pendingAnalysis: AIAnalysis = {
      id: `analysis-${uuidv4()}`,
      logId: id,
      summary: "Analysis pending...",
      rootCause: "Pending AI Worker analysis",
      severity: "low",
      confidence: 0,
      patterns: [],
      relatedLogs: [],
      followUps: [],
      anomalyScore: 0,
      createdAt: new Date().toISOString(),
      modelVersion: "pending",
      status: "pending",
    };

    const saved = await aiService.saveAnalysis(pendingAnalysis);

    logger.info("Analysis triggered", {
      logId: id,
      analysisId: saved.id,
    });

    const response: ApiResponse<AIAnalysis> = {
      success: true,
      data: saved,
      meta: {
        message:
          "Analysis triggered. The AI Worker will process this log shortly.",
      },
    };

    res.status(202).json(response);
  } catch (err) {
    next(err);
  }
};

export const storeAnalysis = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const analysisData = req.body;

    const requiredFields = [
      "logId",
      "summary",
      "rootCause",
      "severity",
      "confidence",
    ];
    for (const field of requiredFields) {
      if (!(field in analysisData)) {
        throw new ApiException(
          "VALIDATION_ERROR",
          `Missing required field: ${field}`,
          400,
        );
      }
    }

    const validSeverities = ["low", "medium", "high", "critical"];
    if (!validSeverities.includes(analysisData.severity)) {
      throw new ApiException(
        "VALIDATION_ERROR",
        `Invalid severity. Must be one of: ${validSeverities.join(", ")}`,
        400,
      );
    }

    const analysis: AIAnalysis = {
      id: analysisData.id || `analysis-${uuidv4()}`,
      logId: analysisData.logId,
      summary: analysisData.summary,
      rootCause: analysisData.rootCause,
      severity: analysisData.severity,
      confidence: analysisData.confidence,
      patterns: analysisData.patterns || [],
      relatedLogs: analysisData.relatedLogs || [],
      followUps: analysisData.followUps || [],
      anomalyScore: analysisData.anomalyScore || 0,
      createdAt: analysisData.createdAt || new Date().toISOString(),
      modelVersion: analysisData.modelVersion || "unknown",
      status: "completed",
    };

    const saved = await aiService.saveAnalysis(analysis);

    logger.info("Analysis stored", {
      analysisId: saved.id,
      logId: saved.logId,
      severity: saved.severity,
      confidence: saved.confidence,
    });

    const response: ApiResponse<AIAnalysis> = {
      success: true,
      data: saved,
    };

    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
};

export const getPendingLogs = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    const recentLogs = await logService.getRecent(limit * 2);
    const pendingLogIds = await aiService.getPendingAnalysisLogIds();

    logger.info("getPendingLogs called", {
      totalRecentLogs: recentLogs.length,
      pendingLogIdsCount: pendingLogIds.length,
      pendingLogIds: pendingLogIds,
    });

    const pendingLogs: LogEntry[] = [];
    const pendingIds = new Set<string>(pendingLogIds);

    const errorLogs = recentLogs.filter(
      (log) => pendingIds.has(log.id) && ["ERROR", "FATAL"].includes(log.level),
    );
    const otherLogs = recentLogs.filter(
      (log) =>
        pendingIds.has(log.id) && !["ERROR", "FATAL"].includes(log.level),
    );

    pendingLogs.push(...errorLogs, ...otherLogs);
    const limitedLogs = pendingLogs.slice(0, limit);

    logger.info("Pending logs response", {
      totalRecentLogs: recentLogs.length,
      totalPending: pendingLogs.length,
      returned: limitedLogs.length,
      errorCount: errorLogs.length,
      otherCount: otherLogs.length,
      returnedLogIds: limitedLogs.map((l) => l.id),
    });

    const response: ApiResponse<LogEntry[]> = {
      success: true,
      data: limitedLogs,
      meta: {
        total: pendingLogs.length,
        limit,
      },
    };

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

export const getAnalysisStats = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const stats = await aiService.getStatistics();

    const response: ApiResponse<typeof stats> = {
      success: true,
      data: stats,
    };

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

export const getCriticalAnalyses = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const critical = await aiService.getCriticalAnalyses();

    const response: ApiResponse<AIAnalysis[]> = {
      success: true,
      data: critical,
    };

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

export const streamAnalysis = async (
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  const { id } = req.params;

  const log = await logService.getById(id);
  if (!log) {
    throw new ApiException("NOT_FOUND", `Log with id '${id}' not found`, 404);
  }

  logger.info(`Streaming analysis for log ${id}`);

  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    const workerUrl = `${process.env.WORKER_BASE_URL || 'http://localhost:8080'}/process-now`;

    const workerRes = await fetch(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ logId: id }),
    });

    if (!workerRes.ok) {
      throw new Error(
        `Worker returned ${workerRes.status}: ${workerRes.statusText}`,
      );
    }

    if (!workerRes.body) {
      throw new Error("Worker response has no body");
    }

    const reader = workerRes.body.getReader();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        res.write(Buffer.from(value));
      }

      res.end();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      logger.error(`Stream reading error: ${message}`);
      res.write(
        `data: ${JSON.stringify({ type: "error", error: "Stream interrupted", done: true })}\n\n`,
      );
      res.end();
    }

    logger.info(`Completed streaming analysis for log ${id}`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error(`Failed to stream analysis for log ${id}: ${message}`);
    res.write(
      `data: ${JSON.stringify({ type: "error", error: message, done: true })}\n\n`,
    );
    res.end();
  }
};

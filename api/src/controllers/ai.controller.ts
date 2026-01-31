import { Request, Response, NextFunction } from "express";
import { aiService } from "../services/ai.service.js";
import { logService } from "../services/log.service.js";
import { ApiResponse, ApiException } from "../types/api.types.js";
import { AIAnalysis, LogEntry } from "../types/log.types.js";
import { logger } from "../utils/logger.js";
import { v4 as uuidv4 } from "uuid";

export const getLogAnalysis = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const { id } = req.params;

    const log = logService.getById(id);
    if (!log) {
      throw new ApiException("NOT_FOUND", `Log with id '${id}' not found`, 404);
    }

    const analysis = aiService.getAnalysis(id);

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

export const triggerAnalysis = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const { id } = req.params;

    const log = logService.getById(id);
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
    };

    aiService.saveAnalysis(pendingAnalysis);

    logger.info("Analysis triggered", {
      logId: id,
      analysisId: pendingAnalysis.id,
    });

    const response: ApiResponse<AIAnalysis> = {
      success: true,
      data: pendingAnalysis,
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

export const storeAnalysis = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
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
    };

    const saved = aiService.saveAnalysis(analysis);

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

export const getPendingLogs = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    const recentLogs = logService.getRecent(limit * 2);

    const pendingLogs: LogEntry[] = [];
    const analyzedIds = new Set<string>();

    for (const log of recentLogs) {
      if (aiService.hasAnalysis(log.id)) {
        analyzedIds.add(log.id);
      }
    }

    const errorLogs = recentLogs.filter(
      (log) =>
        !analyzedIds.has(log.id) && ["ERROR", "FATAL"].includes(log.level),
    );
    const otherLogs = recentLogs.filter(
      (log) =>
        !analyzedIds.has(log.id) && !["ERROR", "FATAL"].includes(log.level),
    );

    pendingLogs.push(...errorLogs, ...otherLogs);
    const limitedLogs = pendingLogs.slice(0, limit);

    logger.debug("Pending logs requested", {
      totalPending: pendingLogs.length,
      returned: limitedLogs.length,
      errorCount: errorLogs.length,
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

export const getAnalysisStats = (
  _req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const stats = aiService.getStatistics();

    const response: ApiResponse<typeof stats> = {
      success: true,
      data: stats,
    };

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

export const getCriticalAnalyses = (
  _req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const critical = aiService.getCriticalAnalyses();

    const response: ApiResponse<AIAnalysis[]> = {
      success: true,
      data: critical,
    };

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

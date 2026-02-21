import { Request, Response } from "express";
import { logService } from "../services/log.service.js";
import { sourceRepository } from "../db/repositories/source.repository.js";
import { checkDatabaseConnection } from "../db/index.js";
import { ApiResponse, HealthResponse } from "../types/api.types.js";
import { appConfig } from "../config/index.js";
import { logger } from "../utils/logger.js";

export const getHealth = async (_req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  
  let dbConnected = false;
  let dbLatency: number | undefined;
  
  try {
    dbConnected = await checkDatabaseConnection();
    dbLatency = Date.now() - startTime;
  } catch (error) {
    logger.error("Database health check failed", { 
      error: error instanceof Error ? error.message : "Unknown error" 
    });
  }

  const stats = await logService.getStats();
  const sourceCounts = await sourceRepository.countByStatus();

  const status: HealthResponse["status"] = dbConnected ? "healthy" : "unhealthy";

  const response: ApiResponse<HealthResponse> = {
    success: true,
    data: {
      status,
      version: appConfig.version,
      uptime: Math.floor(process.uptime()),
      database: {
        connected: dbConnected,
        latency: dbLatency,
      },
      sources: {
        total: sourceCounts.active + sourceCounts.inactive + sourceCounts.error,
        active: sourceCounts.active,
        inactive: sourceCounts.inactive,
        errors: sourceCounts.error,
      },
      metrics: {
        logsPerSecond: Math.round(stats.logsPerSecond * 100) / 100,
        totalLogs: stats.totalLogs,
        storageUsed: stats.totalLogs * 1024,
      },
    },
  };

  res.status(dbConnected ? 200 : 503).json(response);
};

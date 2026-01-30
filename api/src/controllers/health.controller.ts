import { Request, Response } from "express";
import { logService } from "../services/log.service.js";
import { ApiResponse, HealthResponse } from "../types/api.types.js";
import { appConfig } from "../config/index.js";

export const getHealth = (_req: Request, res: Response): void => {
  const stats = logService.getStats();
  const sources = logService.getSources();

  const response: ApiResponse<HealthResponse> = {
    success: true,
    data: {
      status: "healthy",
      version: appConfig.version,
      uptime: Math.floor(process.uptime()),
      sources: {
        total: sources.length,
        active: sources.length,
        errors: 0,
      },
      metrics: {
        logsPerSecond: Math.round(stats.logsPerSecond * 100) / 100,
        totalLogs: stats.totalLogs,
        storageUsed: stats.totalLogs * 1024,
      },
    },
  };

  res.status(200).json(response);
};

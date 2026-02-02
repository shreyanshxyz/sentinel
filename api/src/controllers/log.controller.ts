import { Request, Response, NextFunction } from "express";
import { logService } from "../services/log.service.js";
import { streamService } from "../services/stream.service.js";
import {
  ApiResponse,
  ApiException,
  PaginatedResponse,
} from "../types/api.types.js";
import { LogEntry, LogLevel } from "../types/log.types.js";
import { appConfig } from "../config/index.js";
import {
  createLogSchema,
  logQuerySchema,
  logIdSchema,
} from "../validation/log.schema.js";

export const ingestLog = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const input = createLogSchema.parse(req.body);
    const log = logService.create(input);

    streamService.broadcastLog(log);

    const response: ApiResponse<LogEntry> = {
      success: true,
      data: log,
    };

    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
};

export const getLogs = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const query = logQuerySchema.parse(req.query);

    const limit = query.limit
      ? Math.min(parseInt(query.limit, 10), appConfig.log.maxPageSize)
      : appConfig.log.defaultPageSize;
    const offset = query.offset ? parseInt(query.offset, 10) : 0;

    const levels = query.levels
      ? (query.levels.split(",") as LogLevel[])
      : undefined;
    const sources = query.sources ? query.sources.split(",") : undefined;

    const result = logService.search({
      query: query.query,
      levels,
      sources,
      startTime: query.startTime,
      endTime: query.endTime,
      limit,
      offset,
    });

    const totalPages = Math.ceil(result.total / limit);
    const page = Math.floor(offset / limit) + 1;

    const response: PaginatedResponse<LogEntry> = {
      success: true,
      data: result.logs,
      meta: {
        total: result.total,
        page,
        limit,
        hasNext: offset + limit < result.total,
        hasPrev: offset > 0,
        totalPages,
      },
    };

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

export const getLogById = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const { id } = logIdSchema.parse(req.params);
    const log = logService.getById(id);

    if (!log) {
      throw new ApiException("NOT_FOUND", `Log with id '${id}' not found`, 404);
    }

    const response: ApiResponse<LogEntry> = {
      success: true,
      data: log,
    };

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

export const streamLogs = (
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  streamService.addClient(res);
};

export const getSources = (
  _req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const sources = logService.getSources();
    const response: ApiResponse<{
      id: string;
      name: string;
      type: string;
      status: string;
      config: Record<string, string>;
      lastSeen: string;
    }[]> = {
      success: true,
      data: sources.map((name) => ({
        id: name,
        name,
        type: "api",
        status: "active",
        config: {},
        lastSeen: new Date().toISOString(),
      })),
    };
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

import { Request, Response, NextFunction } from "express";
import { analyticsRepository, AggregatedStats } from "../db/repositories/analytics.repository.js";
import { ApiResponse, ApiException } from "../types/api.types.js";
import { logger } from "../utils/logger.js";

type TimeRange = "1h" | "6h" | "24h" | "7d" | "30d";

const timeRangeMinutes: Record<TimeRange, number> = {
  "1h": 60,
  "6h": 360,
  "24h": 1440,
  "7d": 10080,
  "30d": 43200,
};

function parseTimeRange(range: string): { start: Date; end: Date } {
  const now = new Date();
  const end = now;

  let minutes = 1440;

  if (range in timeRangeMinutes) {
    minutes = timeRangeMinutes[range as TimeRange];
  } else {
    const parsed = parseInt(range);
    if (!isNaN(parsed)) {
      minutes = parsed * 60;
    }
  }

  const start = new Date(now.getTime() - minutes * 60 * 1000);

  return { start, end };
}

function parseTimeParams(
  startStr?: string,
  endStr?: string,
  range?: string
): { start: Date; end: Date } {
  if (startStr && endStr) {
    const start = new Date(startStr);
    const end = new Date(endStr);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new ApiException(
        "VALIDATION_ERROR",
        "Invalid date format for start or end parameter",
        400
      );
    }

    return { start, end };
  }

  return parseTimeRange(range ?? "24h");
}

export const getAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { start, end, range } = req.query;

    const { start: startDate, end: endDate } = parseTimeParams(
      start as string,
      end as string,
      range as string
    );

    logger.debug("Analytics request", {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      range: range ?? "24h",
    });

    const stats = await analyticsRepository.getAggregatedStats(
      startDate,
      endDate
    );

    const response: ApiResponse<AggregatedStats> = {
      success: true,
      data: stats,
      meta: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    };

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

export const getHourlyStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { start, end, range } = req.query;

    const { start: startDate, end: endDate } = parseTimeParams(
      start as string,
      end as string,
      range as string
    );

    const stats = await analyticsRepository.getHourlyStats(startDate, endDate);

    const response: ApiResponse<typeof stats> = {
      success: true,
      data: stats,
      meta: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    };

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

export const getTimeSeries = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { start, end, range, interval } = req.query;

    const { start: startDate, end: endDate } = parseTimeParams(
      start as string,
      end as string,
      range as string
    );

    const intervalType = interval === "day" ? "day" : "hour";

    const data = await analyticsRepository.getTimeSeriesData(
      startDate,
      endDate,
      intervalType
    );

    const response: ApiResponse<typeof data> = {
      success: true,
      data,
      meta: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        interval: intervalType,
      },
    };

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};
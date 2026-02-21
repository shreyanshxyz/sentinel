import { sql } from "drizzle-orm";
import { db } from "../index.js";
import { logs } from "../schema.js";
import { gte, lte, and } from "drizzle-orm";
import { logger } from "../../utils/logger.js";

export interface AggregatedStats {
  total: number;
  byLevel: Record<string, number>;
  bySource: Record<string, number>;
}

export interface HourlyStat {
  bucket: string;
  source: string;
  level: string;
  logCount: number;
}

class AnalyticsRepository {
  async getAggregatedStats(start: Date, end: Date): Promise<AggregatedStats> {
    const startTime = start.toISOString();
    const endTime = end.toISOString();

    try {
      const result = await db
        .select({
          level: logs.level,
          source: logs.source,
          count: sql<number>`count(*)::int`,
        })
        .from(logs)
        .where(
          and(gte(logs.timestamp, startTime), lte(logs.timestamp, endTime))
        )
        .groupBy(logs.level, logs.source);

      let total = 0;
      const byLevel: Record<string, number> = {
        DEBUG: 0,
        INFO: 0,
        WARN: 0,
        ERROR: 0,
        FATAL: 0,
      };
      const bySource: Record<string, number> = {};

      for (const row of result) {
        total += row.count;
        byLevel[row.level] = (byLevel[row.level] ?? 0) + row.count;
        bySource[row.source] = (bySource[row.source] ?? 0) + row.count;
      }

      return { total, byLevel, bySource };
    } catch (error) {
      logger.error("Failed to get aggregated stats", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  async getHourlyStats(start: Date, end: Date): Promise<HourlyStat[]> {
    const startTime = start.toISOString();
    const endTime = end.toISOString();

    try {
      const result = await db.execute(sql`
        SELECT 
          bucket,
          source,
          level,
          log_count as "logCount"
        FROM logs_hourly_stats
        WHERE bucket >= ${startTime} AND bucket < ${endTime}
        ORDER BY bucket DESC, source, level
      `);

      return result.rows.map((row: any) => ({
        bucket: row.bucket,
        source: row.source,
        level: row.level,
        logCount: row.logCount,
      }));
    } catch (error) {
      logger.warn("Hourly stats not available, falling back to direct query", {
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return this.getHourlyStatsFallback(start, end);
    }
  }

  private async getHourlyStatsFallback(
    start: Date,
    end: Date
  ): Promise<HourlyStat[]> {
    const startTime = start.toISOString();
    const endTime = end.toISOString();

    const result = await db.execute(sql`
      SELECT 
        time_bucket('1 hour', timestamp) as bucket,
        source,
        level,
        count(*) as log_count
      FROM logs
      WHERE timestamp >= ${startTime} AND timestamp < ${endTime}
      GROUP BY bucket, source, level
      ORDER BY bucket DESC, source, level
    `);

    return result.rows.map((row: any) => ({
      bucket: row.bucket,
      source: row.source,
      level: row.level,
      logCount: row.log_count,
    }));
  }

  async getTimeSeriesData(
    start: Date,
    end: Date,
    interval: "hour" | "day" = "hour"
  ): Promise<{
    buckets: string[];
    series: Record<string, number[]>;
  }> {
    const startTime = start.toISOString();
    const endTime = end.toISOString();
    const intervalStr = interval === "hour" ? "1 hour" : "1 day";

    try {
      const result = await db.execute(sql`
        SELECT 
          time_bucket(${intervalStr}, timestamp) as bucket,
          level,
          count(*) as log_count
        FROM logs
        WHERE timestamp >= ${startTime} AND timestamp < ${endTime}
        GROUP BY bucket, level
        ORDER BY bucket ASC
      `);

      const bucketSet = new Set<string>();
      const data: Record<string, Record<string, number>> = {};

      for (const row of result.rows) {
        const bucket = row.bucket as string;
        const level = row.level as string;
        const count = row.log_count as number;

        bucketSet.add(bucket);
        if (!data[bucket]) data[bucket] = {};
        data[bucket][level] = count;
      }

      const buckets = Array.from(bucketSet).sort();
      const levels = ["DEBUG", "INFO", "WARN", "ERROR", "FATAL"];
      const series: Record<string, number[]> = {};

      for (const level of levels) {
        series[level] = buckets.map(
          (bucket) => data[bucket]?.[level] ?? 0
        );
      }

      return { buckets, series };
    } catch (error) {
      logger.error("Failed to get time series data", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }
}

export const analyticsRepository = new AnalyticsRepository();

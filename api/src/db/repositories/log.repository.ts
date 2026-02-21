import { eq, and, desc, inArray, sql, gte, lte, or, ilike } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../index.js";
import { logs, type LogRow, type NewLogRow } from "../schema.js";
import { LogEntry, LogFilter, CreateLogInput } from "../../types/log.types.js";
import { appConfig } from "../../config/index.js";
import { logger } from "../../utils/logger.js";

function generateId(): string {
  return `log-${uuidv4()}`;
}

function rowToEntry(row: LogRow): LogEntry {
  return {
    id: row.id,
    timestamp: row.timestamp,
    level: row.level as LogEntry["level"],
    message: row.message,
    source: row.source,
    labels: row.labels ?? {},
    metadata: row.metadata ?? undefined,
    raw: row.raw ?? undefined,
  };
}

class LogRepository {
  private startTime: number = Date.now();
  private logsIngested: number = 0;

  async create(input: CreateLogInput): Promise<LogEntry> {
    const id = generateId();
    const timestamp = input.timestamp ?? new Date().toISOString();

    const newLog: NewLogRow = {
      id,
      timestamp,
      level: input.level,
      message: input.message,
      source: input.source,
      labels: input.labels ?? {},
      metadata: input.metadata ?? {},
      raw: input.raw ?? null,
    };

    await db.insert(logs).values(newLog);
    this.logsIngested++;

    logger.debug("Log created in database", {
      id,
      source: input.source,
      level: input.level,
    });

    return rowToEntry(newLog as LogRow);
  }

  async getById(id: string): Promise<LogEntry | null> {
    const result = await db.select().from(logs).where(eq(logs.id, id)).limit(1);
    return result.length > 0 ? rowToEntry(result[0]) : null;
  }

  async search(filter: LogFilter): Promise<{ logs: LogEntry[]; total: number }> {
    const conditions: any[] = [];

    if (filter.levels && filter.levels.length > 0) {
      conditions.push(inArray(logs.level, filter.levels));
    }

    if (filter.sources && filter.sources.length > 0) {
      conditions.push(inArray(logs.source, filter.sources));
    }

    if (filter.startTime) {
      conditions.push(gte(logs.timestamp, filter.startTime));
    }

    if (filter.endTime) {
      conditions.push(lte(logs.timestamp, filter.endTime));
    }

    if (filter.labels && Object.keys(filter.labels).length > 0) {
      for (const [key, value] of Object.entries(filter.labels)) {
        conditions.push(
          sql`${logs.labels}->>${key} = ${value}`
        );
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(logs)
      .where(whereClause);

    const total = countResult[0]?.count ?? 0;

    const limit = Math.min(
      filter.limit ?? appConfig.log.defaultPageSize,
      appConfig.log.maxPageSize
    );
    const offset = filter.offset ?? 0;

    let query = db
      .select()
      .from(logs)
      .where(whereClause)
      .orderBy(desc(logs.timestamp))
      .limit(limit)
      .offset(offset);

    if (filter.query) {
      const searchQuery = filter.query.toLowerCase();
      const searchConditions = [
        ilike(logs.message, `%${searchQuery}%`),
        ilike(logs.source, `%${searchQuery}%`),
        sql`EXISTS (
          SELECT 1 FROM jsonb_each_text(${logs.labels}) 
          WHERE lower(value) LIKE ${`%${searchQuery}%`}
        )`,
      ];
      
      if (whereClause) {
        query = db
          .select()
          .from(logs)
          .where(and(whereClause, or(...searchConditions)))
          .orderBy(desc(logs.timestamp))
          .limit(limit)
          .offset(offset);
      } else {
        query = db
          .select()
          .from(logs)
          .where(or(...searchConditions))
          .orderBy(desc(logs.timestamp))
          .limit(limit)
          .offset(offset);
      }

      const searchCountResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(logs)
        .where(and(whereClause, or(...searchConditions)));
      
      const searchTotal = searchCountResult[0]?.count ?? 0;
      const results = await query;
      return { logs: results.map(rowToEntry), total: searchTotal };
    }

    const results = await query;
    return { logs: results.map(rowToEntry), total };
  }

  async getRecent(limit: number = 100): Promise<LogEntry[]> {
    const results = await db
      .select()
      .from(logs)
      .orderBy(desc(logs.timestamp))
      .limit(limit);

    return results.map(rowToEntry);
  }

  async getSources(): Promise<string[]> {
    const result = await db
      .selectDistinct({ source: logs.source })
      .from(logs);

    return result.map((r) => r.source);
  }

  async getStats(): Promise<{
    totalLogs: number;
    sources: number;
    uptime: number;
    logsPerSecond: number;
  }> {
    const uptime = (Date.now() - this.startTime) / 1000;

    const [countResult, sourcesResult] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(logs),
      db.selectDistinct({ source: logs.source }).from(logs),
    ]);

    return {
      totalLogs: countResult[0]?.count ?? 0,
      sources: sourcesResult.length,
      uptime,
      logsPerSecond: uptime > 0 ? this.logsIngested / uptime : 0,
    };
  }

  async count(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(logs);
    return result[0]?.count ?? 0;
  }

  async countByLevel(): Promise<Record<string, number>> {
    const result = await db
      .select({
        level: logs.level,
        count: sql<number>`count(*)::int`,
      })
      .from(logs)
      .groupBy(logs.level);

    const counts: Record<string, number> = {
      DEBUG: 0,
      INFO: 0,
      WARN: 0,
      ERROR: 0,
      FATAL: 0,
    };

    for (const row of result) {
      counts[row.level] = row.count;
    }

    return counts;
  }

  async deleteOlderThan(days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await db
      .delete(logs)
      .where(lte(logs.timestamp, cutoffDate.toISOString()))
      .returning({ id: logs.id });

    return result.length;
  }
}

export const logRepository = new LogRepository();

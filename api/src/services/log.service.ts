import { v4 as uuidv4 } from "uuid";
import { LogEntry, LogFilter, CreateLogInput } from "../types/log.types.js";
import { appConfig } from "../config/index.js";
import { logger } from "../utils/logger.js";

class LogService {
  private logs: Map<string, LogEntry> = new Map();
  private orderedLogIds: string[] = [];
  private sources: Set<string> = new Set();
  private startTime: number = Date.now();
  private logsIngested: number = 0;

  create(input: CreateLogInput): LogEntry {
    const id = `log-${uuidv4()}`;
    const timestamp = input.timestamp ?? new Date().toISOString();

    const logEntry: LogEntry = {
      id,
      timestamp,
      level: input.level,
      message: input.message,
      source: input.source,
      labels: input.labels ?? {},
      metadata: input.metadata,
      raw: input.raw,
    };

    this.logs.set(id, logEntry);
    this.orderedLogIds.unshift(id);
    this.sources.add(input.source);
    this.logsIngested++;

    this.enforceMaxLogs();

    logger.debug("Log created", {
      id,
      source: input.source,
      level: input.level,
    });

    return logEntry;
  }

  getById(id: string): LogEntry | undefined {
    return this.logs.get(id);
  }

  search(filter: LogFilter): { logs: LogEntry[]; total: number } {
    let results = Array.from(this.logs.values());

    if (filter.query) {
      const query = filter.query.toLowerCase();
      results = results.filter(
        (log) =>
          log.message.toLowerCase().includes(query) ||
          log.source.toLowerCase().includes(query) ||
          Object.values(log.labels).some((v) =>
            v.toLowerCase().includes(query),
          ),
      );
    }

    if (filter.levels && filter.levels.length > 0) {
      results = results.filter((log) => filter.levels!.includes(log.level));
    }

    if (filter.sources && filter.sources.length > 0) {
      results = results.filter((log) => filter.sources!.includes(log.source));
    }

    if (filter.labels && Object.keys(filter.labels).length > 0) {
      results = results.filter((log) =>
        Object.entries(filter.labels!).every(
          ([key, value]) => log.labels[key] === value,
        ),
      );
    }

    if (filter.startTime) {
      const start = new Date(filter.startTime).getTime();
      results = results.filter(
        (log) => new Date(log.timestamp).getTime() >= start,
      );
    }

    if (filter.endTime) {
      const end = new Date(filter.endTime).getTime();
      results = results.filter(
        (log) => new Date(log.timestamp).getTime() <= end,
      );
    }

    results.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    const total = results.length;
    const limit = Math.min(
      filter.limit ?? appConfig.log.defaultPageSize,
      appConfig.log.maxPageSize,
    );
    const offset = filter.offset ?? 0;

    const paginated = results.slice(offset, offset + limit);

    return { logs: paginated, total };
  }

  getRecent(limit: number = 100): LogEntry[] {
    const count = Math.min(limit, this.orderedLogIds.length);
    return this.orderedLogIds
      .slice(0, count)
      .map((id) => this.logs.get(id)!)
      .filter(Boolean);
  }

  getSources(): string[] {
    return Array.from(this.sources);
  }

  getStats(): {
    totalLogs: number;
    sources: number;
    uptime: number;
    logsPerSecond: number;
  } {
    const uptime = (Date.now() - this.startTime) / 1000;
    return {
      totalLogs: this.logs.size,
      sources: this.sources.size,
      uptime,
      logsPerSecond: uptime > 0 ? this.logsIngested / uptime : 0,
    };
  }

  private enforceMaxLogs(): void {
    const max = appConfig.log.maxLogsInMemory;
    while (this.orderedLogIds.length > max) {
      const id = this.orderedLogIds.pop();
      if (id) {
        this.logs.delete(id);
      }
    }
  }
}

export const logService = new LogService();

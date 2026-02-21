import { LogEntry, LogFilter, CreateLogInput } from "../types/log.types.js";
import { logRepository } from "../db/repositories/log.repository.js";
import { logger } from "../utils/logger.js";

class LogService {
  async create(input: CreateLogInput): Promise<LogEntry> {
    const log = await logRepository.create(input);
    logger.debug("Log created", {
      id: log.id,
      source: log.source,
      level: log.level,
    });
    return log;
  }

  async getById(id: string): Promise<LogEntry | null> {
    return logRepository.getById(id);
  }

  async search(filter: LogFilter): Promise<{ logs: LogEntry[]; total: number }> {
    return logRepository.search(filter);
  }

  async getRecent(limit: number = 100): Promise<LogEntry[]> {
    return logRepository.getRecent(limit);
  }

  async getSources(): Promise<string[]> {
    return logRepository.getSources();
  }

  async getStats(): Promise<{
    totalLogs: number;
    sources: number;
    uptime: number;
    logsPerSecond: number;
  }> {
    return logRepository.getStats();
  }

  async count(): Promise<number> {
    return logRepository.count();
  }

  async countByLevel(): Promise<Record<string, number>> {
    return logRepository.countByLevel();
  }

  async deleteOlderThan(days: number): Promise<number> {
    return logRepository.deleteOlderThan(days);
  }
}

export const logService = new LogService();

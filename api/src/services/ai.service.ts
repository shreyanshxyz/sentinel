import { LogEntry, AIAnalysis } from "../types/log.types.js";
import { logger } from "../utils/logger.js";

class AIService {
  private analyses: Map<string, AIAnalysis> = new Map();

  private logService: { getById: (id: string) => LogEntry | undefined } | null =
    null;

  initialize(logService: {
    getById: (id: string) => LogEntry | undefined;
  }): void {
    this.logService = logService;
    logger.info("AI Service initialized");
  }

  saveAnalysis(analysis: AIAnalysis): AIAnalysis {
    this.analyses.set(analysis.logId, analysis);

    logger.debug("AI analysis saved", {
      analysisId: analysis.id,
      logId: analysis.logId,
      severity: analysis.severity,
      confidence: analysis.confidence,
    });

    return analysis;
  }

  getAnalysis(logId: string): AIAnalysis | undefined {
    return this.analyses.get(logId);
  }

  hasAnalysis(logId: string): boolean {
    return this.analyses.has(logId);
  }

  hasPendingAnalysis(logId: string): boolean {
    const analysis = this.analyses.get(logId);
    return analysis?.status === "pending";
  }

  getPendingAnalyses(): AIAnalysis[] {
    return this.getAllAnalyses().filter((a) => a.status === "pending");
  }

  getPendingAnalysisLogIds(): string[] {
    return this.getPendingAnalyses().map((a) => a.logId);
  }

  getAllAnalyses(): AIAnalysis[] {
    return Array.from(this.analyses.values());
  }

  getAnalysesBySeverity(severity: AIAnalysis["severity"]): AIAnalysis[] {
    return this.getAllAnalyses().filter((a) => a.severity === severity);
  }

  getHighConfidenceAnalyses(): AIAnalysis[] {
    return this.getAllAnalyses().filter((a) => a.confidence >= 70);
  }

  getCriticalAnalyses(): AIAnalysis[] {
    return this.getAllAnalyses().filter(
      (a) => a.severity === "critical" || a.anomalyScore > 0.8,
    );
  }

  deleteAnalysis(logId: string): boolean {
    const existed = this.analyses.has(logId);
    this.analyses.delete(logId);

    if (existed) {
      logger.debug("AI analysis deleted", { logId });
    }

    return existed;
  }

  getAnalysisCount(): number {
    return this.analyses.size;
  }

  getStatistics(): {
    total: number;
    bySeverity: Record<string, number>;
    highConfidence: number;
    critical: number;
  } {
    const analyses = this.getAllAnalyses();

    const bySeverity: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    for (const analysis of analyses) {
      bySeverity[analysis.severity]++;
    }

    return {
      total: analyses.length,
      bySeverity,
      highConfidence: analyses.filter((a) => a.confidence >= 70).length,
      critical: analyses.filter((a) => a.severity === "critical").length,
    };
  }

  clearAll(): void {
    const count = this.analyses.size;
    this.analyses.clear();
    logger.info("All AI analyses cleared", { count });
  }
}

export const aiService = new AIService();

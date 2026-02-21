import { AIAnalysis } from "../types/log.types.js";
import { 
  analysisRepository, 
  CreateAnalysisInput 
} from "../db/repositories/analysis.repository.js";
import { logger } from "../utils/logger.js";

class AIService {
  async saveAnalysis(analysis: AIAnalysis): Promise<AIAnalysis> {
    const input: CreateAnalysisInput = {
      id: analysis.id,
      logId: analysis.logId,
      summary: analysis.summary,
      rootCause: analysis.rootCause,
      severity: analysis.severity,
      confidence: analysis.confidence,
      patterns: analysis.patterns,
      relatedLogs: analysis.relatedLogs,
      followUps: analysis.followUps,
      anomalyScore: analysis.anomalyScore,
      modelVersion: analysis.modelVersion,
      status: analysis.status,
    };

    const saved = await analysisRepository.save(input);

    logger.debug("AI analysis saved", {
      analysisId: saved.id,
      logId: saved.logId,
      severity: saved.severity,
      confidence: saved.confidence,
    });

    return saved;
  }

  async getAnalysis(logId: string): Promise<AIAnalysis | null> {
    return analysisRepository.getByLogId(logId);
  }

  async hasAnalysis(logId: string): Promise<boolean> {
    return analysisRepository.hasAnalysis(logId);
  }

  async hasPendingAnalysis(logId: string): Promise<boolean> {
    return analysisRepository.hasPendingAnalysis(logId);
  }

  async getPendingAnalyses(): Promise<AIAnalysis[]> {
    return analysisRepository.getPendingAnalyses();
  }

  async getPendingAnalysisLogIds(): Promise<string[]> {
    return analysisRepository.getPendingLogIds();
  }

  async getAllAnalyses(): Promise<AIAnalysis[]> {
    return analysisRepository.getAll();
  }

  async getAnalysesBySeverity(severity: AIAnalysis["severity"]): Promise<AIAnalysis[]> {
    return analysisRepository.getBySeverity(severity);
  }

  async getHighConfidenceAnalyses(): Promise<AIAnalysis[]> {
    const all = await analysisRepository.getAll();
    return all.filter((a) => a.confidence >= 70);
  }

  async getCriticalAnalyses(): Promise<AIAnalysis[]> {
    return analysisRepository.getCritical();
  }

  async deleteAnalysis(logId: string): Promise<boolean> {
    const deleted = await analysisRepository.delete(logId);
    if (deleted) {
      logger.debug("AI analysis deleted", { logId });
    }
    return deleted;
  }

  async getAnalysisCount(): Promise<number> {
    return analysisRepository.getCount();
  }

  async getStatistics(): Promise<{
    total: number;
    bySeverity: Record<string, number>;
    highConfidence: number;
    critical: number;
  }> {
    return analysisRepository.getStatistics();
  }
}

export const aiService = new AIService();

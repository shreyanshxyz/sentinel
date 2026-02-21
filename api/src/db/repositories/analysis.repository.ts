import { eq, and, desc, gte, or, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../index.js";
import { 
  aiAnalyses, 
  type AIAnalysisRow, 
  type NewAIAnalysisRow,
  type Severity,
  type AnalysisStatus 
} from "../schema.js";
import { AIAnalysis, FollowUpAction } from "../../types/log.types.js";
import { logger } from "../../utils/logger.js";

function generateId(): string {
  return `analysis-${uuidv4()}`;
}

function rowToAnalysis(row: AIAnalysisRow): AIAnalysis {
  return {
    id: row.id,
    logId: row.logId,
    summary: row.summary,
    rootCause: row.rootCause ?? "",
    severity: row.severity as AIAnalysis["severity"],
    confidence: row.confidence ? parseFloat(row.confidence) : 0,
    patterns: row.patterns ?? [],
    relatedLogs: row.relatedLogs ?? [],
    followUps: (row.followUps as FollowUpAction[]) ?? [],
    anomalyScore: row.anomalyScore ? parseFloat(row.anomalyScore) : 0,
    createdAt: row.createdAt ?? new Date().toISOString(),
    modelVersion: row.modelVersion ?? "unknown",
    status: row.status as AIAnalysis["status"],
  };
}

export interface CreateAnalysisInput {
  id?: string;
  logId: string;
  summary: string;
  rootCause: string;
  severity: Severity;
  confidence: number;
  patterns?: string[];
  relatedLogs?: string[];
  followUps?: FollowUpAction[];
  anomalyScore?: number;
  modelVersion?: string;
  status?: AnalysisStatus;
}

class AnalysisRepository {
  async save(input: CreateAnalysisInput): Promise<AIAnalysis> {
    const id = input.id ?? generateId();
    const now = new Date().toISOString();

    const existingAnalysis = await this.getByLogId(input.logId);

    if (existingAnalysis) {
      const updateData: Partial<NewAIAnalysisRow> = {
        summary: input.summary,
        rootCause: input.rootCause,
        severity: input.severity,
        confidence: input.confidence.toString(),
        patterns: input.patterns ?? [],
        relatedLogs: input.relatedLogs ?? [],
        followUps: input.followUps ?? [],
        anomalyScore: (input.anomalyScore ?? 0).toString(),
        modelVersion: input.modelVersion ?? "unknown",
        status: input.status ?? "completed",
      };

      await db
        .update(aiAnalyses)
        .set(updateData)
        .where(eq(aiAnalyses.logId, input.logId));

      logger.debug("AI analysis updated in database", {
        analysisId: existingAnalysis.id,
        logId: input.logId,
        severity: input.severity,
      });

      return {
        ...existingAnalysis,
        ...updateData,
        confidence: input.confidence,
        anomalyScore: input.anomalyScore ?? 0,
        status: input.status ?? "completed",
      } as AIAnalysis;
    }

    const newAnalysis: NewAIAnalysisRow = {
      id,
      logId: input.logId,
      summary: input.summary,
      rootCause: input.rootCause,
      severity: input.severity,
      confidence: input.confidence.toString(),
      patterns: input.patterns ?? [],
      relatedLogs: input.relatedLogs ?? [],
      followUps: input.followUps ?? [],
      anomalyScore: (input.anomalyScore ?? 0).toString(),
      modelVersion: input.modelVersion ?? "unknown",
      status: input.status ?? "completed",
      createdAt: now,
    };

    await db.insert(aiAnalyses).values(newAnalysis);

    logger.debug("AI analysis saved to database", {
      analysisId: id,
      logId: input.logId,
      severity: input.severity,
    });

    return rowToAnalysis(newAnalysis as AIAnalysisRow);
  }

  async getByLogId(logId: string): Promise<AIAnalysis | null> {
    const result = await db
      .select()
      .from(aiAnalyses)
      .where(eq(aiAnalyses.logId, logId))
      .limit(1);

    return result.length > 0 ? rowToAnalysis(result[0]) : null;
  }

  async hasAnalysis(logId: string): Promise<boolean> {
    const result = await db
      .select({ id: aiAnalyses.id })
      .from(aiAnalyses)
      .where(eq(aiAnalyses.logId, logId))
      .limit(1);

    return result.length > 0;
  }

  async hasPendingAnalysis(logId: string): Promise<boolean> {
    const result = await db
      .select({ id: aiAnalyses.id })
      .from(aiAnalyses)
      .where(and(eq(aiAnalyses.logId, logId), eq(aiAnalyses.status, "pending")))
      .limit(1);

    return result.length > 0;
  }

  async getPendingAnalyses(): Promise<AIAnalysis[]> {
    const results = await db
      .select()
      .from(aiAnalyses)
      .where(eq(aiAnalyses.status, "pending"))
      .orderBy(desc(aiAnalyses.createdAt));

    return results.map(rowToAnalysis);
  }

  async getPendingLogIds(): Promise<string[]> {
    const results = await db
      .select({ logId: aiAnalyses.logId })
      .from(aiAnalyses)
      .where(eq(aiAnalyses.status, "pending"));

    return results.map((r) => r.logId);
  }

  async getAll(): Promise<AIAnalysis[]> {
    const results = await db
      .select()
      .from(aiAnalyses)
      .orderBy(desc(aiAnalyses.createdAt));

    return results.map(rowToAnalysis);
  }

  async getBySeverity(severity: Severity): Promise<AIAnalysis[]> {
    const results = await db
      .select()
      .from(aiAnalyses)
      .where(eq(aiAnalyses.severity, severity))
      .orderBy(desc(aiAnalyses.createdAt));

    return results.map(rowToAnalysis);
  }

  async getCritical(): Promise<AIAnalysis[]> {
    const results = await db
      .select()
      .from(aiAnalyses)
      .where(
        or(
          eq(aiAnalyses.severity, "critical"),
          gte(aiAnalyses.anomalyScore, "0.8")
        )
      )
      .orderBy(desc(aiAnalyses.createdAt));

    return results.map(rowToAnalysis);
  }

  async delete(logId: string): Promise<boolean> {
    const result = await db
      .delete(aiAnalyses)
      .where(eq(aiAnalyses.logId, logId))
      .returning({ id: aiAnalyses.id });

    if (result.length > 0) {
      logger.debug("AI analysis deleted from database", { logId });
      return true;
    }

    return false;
  }

  async getCount(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(aiAnalyses);

    return result[0]?.count ?? 0;
  }

  async getStatistics(): Promise<{
    total: number;
    bySeverity: Record<string, number>;
    highConfidence: number;
    critical: number;
  }> {
    const [countResult, severityResult, highConfidenceResult, criticalResult] = 
      await Promise.all([
        db.select({ count: sql<number>`count(*)::int` }).from(aiAnalyses),
        
        db
          .select({
            severity: aiAnalyses.severity,
            count: sql<number>`count(*)::int`,
          })
          .from(aiAnalyses)
          .groupBy(aiAnalyses.severity),

        db
          .select({ count: sql<number>`count(*)::int` })
          .from(aiAnalyses)
          .where(gte(aiAnalyses.confidence, "70")),

        db
          .select({ count: sql<number>`count(*)::int` })
          .from(aiAnalyses)
          .where(eq(aiAnalyses.severity, "critical")),
      ]);

    const bySeverity: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    for (const row of severityResult) {
      bySeverity[row.severity] = row.count;
    }

    return {
      total: countResult[0]?.count ?? 0,
      bySeverity,
      highConfidence: highConfidenceResult[0]?.count ?? 0,
      critical: criticalResult[0]?.count ?? 0,
    };
  }
}

export const analysisRepository = new AnalysisRepository();

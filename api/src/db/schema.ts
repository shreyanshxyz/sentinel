import {
  pgTable,
  timestamp,
  varchar,
  text,
  jsonb,
  decimal,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const logLevels = ["DEBUG", "INFO", "WARN", "ERROR", "FATAL"] as const;
export type LogLevel = (typeof logLevels)[number];

export const severities = ["low", "medium", "high", "critical"] as const;
export type Severity = (typeof severities)[number];

export const analysisStatuses = ["pending", "completed", "failed"] as const;
export type AnalysisStatus = (typeof analysisStatuses)[number];

export const sourceTypes = ["file", "syslog", "api", "database"] as const;
export type SourceType = (typeof sourceTypes)[number];

export const sourceStatuses = ["active", "inactive", "error"] as const;
export type SourceStatus = (typeof sourceStatuses)[number];

export const logs = pgTable(
  "logs",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    timestamp: timestamp("timestamp", { withTimezone: true, mode: "string" }).notNull(),
    level: varchar("level", { length: 10 }).$type<LogLevel>().notNull(),
    message: text("message").notNull(),
    source: varchar("source", { length: 255 }).notNull(),
    labels: jsonb("labels").$type<Record<string, string>>().default({}),
    metadata: jsonb("metadata").$type<Record<string, number>>().default({}),
    raw: text("raw"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (table) => ({
    timestampIdx: index("idx_logs_timestamp").on(table.timestamp.desc()),
    levelIdx: index("idx_logs_level").on(table.level),
    sourceIdx: index("idx_logs_source").on(table.source),
    sourceLevelIdx: index("idx_logs_source_level").on(table.source, table.level),
  })
);

export const aiAnalyses = pgTable(
  "ai_analyses",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    logId: varchar("log_id", { length: 255 })
      .notNull()
      .references(() => logs.id, { onDelete: "cascade" }),
    summary: text("summary").notNull(),
    rootCause: text("root_cause"),
    severity: varchar("severity", { length: 20 }).$type<Severity>().notNull(),
    confidence: decimal("confidence", { precision: 5, scale: 2 }),
    patterns: jsonb("patterns").$type<string[]>().default([]),
    relatedLogs: jsonb("related_logs").$type<string[]>().default([]),
    followUps: jsonb("follow_ups").$type<
      Array<{
        id: string;
        title: string;
        description: string;
        priority: Severity;
        type: "investigation" | "fix" | "monitor" | "documentation";
      }>
    >().default([]),
    anomalyScore: decimal("anomaly_score", { precision: 5, scale: 4 }).default("0"),
    modelVersion: varchar("model_version", { length: 50 }),
    status: varchar("status", { length: 20 })
      .$type<AnalysisStatus>()
      .default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (table) => ({
    severityIdx: index("idx_ai_analyses_severity").on(table.severity),
    statusIdx: index("idx_ai_analyses_status").on(table.status),
    logIdIdx: index("idx_ai_analyses_log_id").on(table.logId),
  })
);

export const sources = pgTable("sources", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 })
    .$type<SourceType>()
    .default("api"),
  status: varchar("status", { length: 20 })
    .$type<SourceStatus>()
    .default("active"),
  config: jsonb("config").$type<Record<string, string>>().default({}),
  lastSeen: timestamp("last_seen", { withTimezone: true, mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

export const logsRelations = relations(logs, ({ one }) => ({
  analysis: one(aiAnalyses, {
    fields: [logs.id],
    references: [aiAnalyses.logId],
  }),
}));

export const aiAnalysesRelations = relations(aiAnalyses, ({ one }) => ({
  log: one(logs, {
    fields: [aiAnalyses.logId],
    references: [logs.id],
  }),
}));

export type LogRow = typeof logs.$inferSelect;
export type NewLogRow = typeof logs.$inferInsert;
export type AIAnalysisRow = typeof aiAnalyses.$inferSelect;
export type NewAIAnalysisRow = typeof aiAnalyses.$inferInsert;
export type SourceRow = typeof sources.$inferSelect;
export type NewSourceRow = typeof sources.$inferInsert;

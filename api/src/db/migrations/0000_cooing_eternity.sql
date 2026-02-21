CREATE TABLE "ai_analyses" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"log_id" varchar(255) NOT NULL,
	"summary" text NOT NULL,
	"root_cause" text,
	"severity" varchar(20) NOT NULL,
	"confidence" numeric(5, 2),
	"patterns" jsonb DEFAULT '[]'::jsonb,
	"related_logs" jsonb DEFAULT '[]'::jsonb,
	"follow_ups" jsonb DEFAULT '[]'::jsonb,
	"anomaly_score" numeric(5, 4) DEFAULT '0',
	"model_version" varchar(50),
	"status" varchar(20) DEFAULT 'pending',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "logs" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"level" varchar(10) NOT NULL,
	"message" text NOT NULL,
	"source" varchar(255) NOT NULL,
	"labels" jsonb DEFAULT '{}'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"raw" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(50) DEFAULT 'api',
	"status" varchar(20) DEFAULT 'active',
	"config" jsonb DEFAULT '{}'::jsonb,
	"last_seen" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "ai_analyses" ADD CONSTRAINT "ai_analyses_log_id_logs_id_fk" FOREIGN KEY ("log_id") REFERENCES "public"."logs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ai_analyses_severity" ON "ai_analyses" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_ai_analyses_status" ON "ai_analyses" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_ai_analyses_log_id" ON "ai_analyses" USING btree ("log_id");--> statement-breakpoint
CREATE INDEX "idx_logs_timestamp" ON "logs" USING btree ("timestamp" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_logs_level" ON "logs" USING btree ("level");--> statement-breakpoint
CREATE INDEX "idx_logs_source" ON "logs" USING btree ("source");--> statement-breakpoint
CREATE INDEX "idx_logs_source_level" ON "logs" USING btree ("source","level");
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  

CREATE TABLE IF NOT EXISTS logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ NOT NULL,
  level VARCHAR(10) NOT NULL CHECK (level IN ('DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL')),
  message TEXT NOT NULL,
  source VARCHAR(255) NOT NULL,
  labels JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  raw TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_logs_level ON logs (level);
CREATE INDEX IF NOT EXISTS idx_logs_source ON logs (source);
CREATE INDEX IF NOT EXISTS idx_logs_source_level ON logs (source, level);

CREATE INDEX IF NOT EXISTS idx_logs_message_gin ON logs USING gin(to_tsvector('english', message));

CREATE INDEX IF NOT EXISTS idx_logs_labels ON logs USING gin(labels);

CREATE INDEX IF NOT EXISTS idx_logs_message_trgm ON logs USING gin(message gin_trgm_ops);

CREATE TABLE IF NOT EXISTS ai_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  log_id UUID NOT NULL REFERENCES logs(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  root_cause TEXT,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  confidence DECIMAL(5,2) CHECK (confidence >= 0 AND confidence <= 100),
  patterns JSONB DEFAULT '[]'::jsonb,
  related_logs JSONB DEFAULT '[]'::jsonb,
  follow_ups JSONB DEFAULT '[]'::jsonb,
  anomaly_score DECIMAL(5,4) DEFAULT 0,
  model_version VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_log_analysis UNIQUE(log_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_analyses_severity ON ai_analyses (severity);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_status ON ai_analyses (status);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_log_id ON ai_analyses (log_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_created_at ON ai_analyses (created_at DESC);

CREATE TABLE IF NOT EXISTS sources (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) DEFAULT 'api' CHECK (type IN ('file', 'syslog', 'api', 'database')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  config JSONB DEFAULT '{}',
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sources_status ON sources (status);
CREATE INDEX IF NOT EXISTS idx_sources_last_seen ON sources (last_seen DESC);

CREATE OR REPLACE FUNCTION upsert_source()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO sources (id, name, type, status, last_seen, created_at)
  VALUES (NEW.source, NEW.source, 'api', 'active', NEW.timestamp, NOW())
  ON CONFLICT (id) DO UPDATE SET
    last_seen = EXCLUDED.last_seen,
    status = 'active';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_upsert_source ON logs;
CREATE TRIGGER trg_upsert_source
  AFTER INSERT ON logs
  FOR EACH ROW
  EXECUTE FUNCTION upsert_source();

-- TIMECALLED VIEWS FOR ANALYTICS (Optional - created after TimeScaleDB is set up)

-- Hourly statistics continuous aggregate (requires TimeScaleDB)
-- CREATE MATERIALIZED VIEW logs_hourly_stats
-- WITH (timescaledb.continuous) AS
-- SELECT
--   time_bucket('1 hour', timestamp) AS bucket,
--   source,
--   level,
--   COUNT(*) as log_count
-- FROM logs
-- GROUP BY bucket, source, level
-- WITH NO DATA;

-- RETENTION POLICY (Requires TimeScaleDB)

-- Automatically drop chunks older than retention period
-- SELECT add_retention_policy('logs', INTERVAL '30 days', if_not_exists => TRUE);

-- COMPRESSION POLICY (Requires TimeScaleDB)

-- Enable compression and set policy
-- ALTER TABLE logs SET (
--   timescaledb.compress,
--   timescaledb.compress_segmentby = 'source,level',
--   timescaledb.compress_orderby = 'timestamp DESC'
-- );
-- SELECT add_compression_policy('logs', INTERVAL '7 days', if_not_exists => TRUE);

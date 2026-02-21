CREATE EXTENSION IF NOT EXISTS timescaledb;
SELECT create_hypertable('logs', 'timestamp', 
  if_not_exists => TRUE, 
  chunk_time_interval => INTERVAL '1 day'
);

CREATE MATERIALIZED VIEW IF NOT EXISTS logs_hourly_stats
WITH (timescaledb.continuous) AS
SELECT 
  time_bucket('1 hour', timestamp) AS bucket,
  source,
  level,
  COUNT(*) as log_count
FROM logs
GROUP BY bucket, source, level
WITH NO DATA;

SELECT add_continuous_aggregate_policy('logs_hourly_stats',
  start_offset => INTERVAL '3 hours',
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '10 minutes',
  if_not_exists => TRUE
);

SELECT add_retention_policy('logs', 
  INTERVAL '30 days', 
  if_not_exists => TRUE
);

ALTER TABLE logs SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'source,level',
  timescaledb.compress_orderby = 'timestamp DESC'
);

SELECT add_compression_policy('logs', 
  INTERVAL '7 days', 
  if_not_exists => TRUE
);

CREATE INDEX IF NOT EXISTS idx_logs_hourly_stats_bucket 
  ON logs_hourly_stats (bucket DESC);

CREATE INDEX IF NOT EXISTS idx_logs_hourly_stats_source_level 
  ON logs_hourly_stats (source, level);

CREATE OR REPLACE FUNCTION get_log_stats(
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ
)
RETURNS TABLE (
  total BIGINT,
  level VARCHAR(10),
  log_count BIGINT,
  source VARCHAR(255),
  source_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) OVER () as total,
    l.level,
    COUNT(*) as log_count,
    l.source,
    COUNT(*) OVER (PARTITION BY l.source) as source_count
  FROM logs l
  WHERE l.timestamp >= start_time AND l.timestamp < end_time
  GROUP BY l.level, l.source;
END;
$$ LANGUAGE plpgsql STABLE;

-- Error Logs: captures errors from all backend jobs
CREATE TABLE IF NOT EXISTS error_logs (
  id            BIGSERIAL PRIMARY KEY,
  job_name      TEXT NOT NULL,          -- e.g. 'audit_poller', 'push_to_ads', 'campaign_metrics', 'tally_leads'
  severity      TEXT NOT NULL DEFAULT 'error',  -- 'error', 'warning', 'critical'
  message       TEXT NOT NULL,
  details       JSONB DEFAULT '{}',     -- stack trace, request context, etc.
  resolved      BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Job Heartbeats: tracks last-seen timestamp for each cron job
CREATE TABLE IF NOT EXISTS job_heartbeats (
  id            BIGSERIAL PRIMARY KEY,
  job_name      TEXT UNIQUE NOT NULL,   -- e.g. 'audit_poller', 'campaign_metrics', 'tally_leads'
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status        TEXT DEFAULT 'ok',      -- 'ok', 'error', 'timeout'
  run_count     INTEGER DEFAULT 0,
  last_error    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_error_logs_job_name ON error_logs(job_name);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved);

-- Enable RLS
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_heartbeats ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read
CREATE POLICY "Authenticated users can read error_logs"
  ON error_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read job_heartbeats"
  ON job_heartbeats FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to update resolved status
CREATE POLICY "Authenticated users can update error_logs"
  ON error_logs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Service role can insert (backend scripts use service role key)
CREATE POLICY "Service role can insert error_logs"
  ON error_logs FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service role can all job_heartbeats"
  ON job_heartbeats FOR ALL TO service_role USING (true) WITH CHECK (true);

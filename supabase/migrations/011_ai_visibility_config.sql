-- AI Visibility config table for persisting schedule frequency
-- Single-row config pattern: key/value pairs

CREATE TABLE IF NOT EXISTS ai_visibility_config (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default frequency
INSERT INTO ai_visibility_config (key, value)
VALUES ('schedule_frequency', '2x-week')
ON CONFLICT (key) DO NOTHING;

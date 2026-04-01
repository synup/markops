-- Email Signatures: Key/value settings table
CREATE TABLE IF NOT EXISTS es_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default: auto-import enabled
INSERT INTO es_settings (key, value)
VALUES ('auto_import_enabled', 'true')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE es_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON es_settings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON es_settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

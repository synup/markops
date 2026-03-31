-- Email Signatures: Workspace users synced from Google Admin Directory
CREATE TABLE IF NOT EXISTS es_workspace_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  job_title TEXT,
  department TEXT,
  phone_mobile TEXT,
  phone_work TEXT,
  org_unit TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  signature_override BOOLEAN DEFAULT FALSE,
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE es_workspace_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON es_workspace_users
  FOR ALL TO service_role USING (true) WITH CHECK (true);

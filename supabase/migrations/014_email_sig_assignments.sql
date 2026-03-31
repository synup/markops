-- Email Signatures: Per-user signature assignments (overrides)
CREATE TABLE IF NOT EXISTS es_signature_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES es_workspace_users(id) ON DELETE CASCADE,
  signature_id UUID NOT NULL REFERENCES es_signatures(id) ON DELETE CASCADE,
  is_override BOOLEAN NOT NULL DEFAULT FALSE,
  assigned_by TEXT NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE es_signature_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON es_signature_assignments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON es_signature_assignments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

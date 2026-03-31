-- Email Signatures: Deploy history log
CREATE TABLE IF NOT EXISTS es_deploy_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deployed_by TEXT NOT NULL,
  total_users INT NOT NULL DEFAULT 0,
  success_count INT NOT NULL DEFAULT 0,
  failure_count INT NOT NULL DEFAULT 0,
  per_user_results JSONB,
  deployed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE es_deploy_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON es_deploy_logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_read" ON es_deploy_logs
  FOR SELECT TO authenticated USING (true);

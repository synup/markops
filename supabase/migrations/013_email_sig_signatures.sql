-- Email Signatures: Signature templates with token placeholders
CREATE TABLE IF NOT EXISTS es_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  html_template TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active')),
  is_org_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only one signature can be the org default at a time
CREATE UNIQUE INDEX IF NOT EXISTS one_es_org_default
  ON es_signatures (is_org_default)
  WHERE is_org_default = TRUE;

ALTER TABLE es_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON es_signatures
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON es_signatures
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

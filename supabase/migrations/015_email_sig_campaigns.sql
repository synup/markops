-- Email Signatures: Time-bound banner campaigns attached to signatures
CREATE TABLE IF NOT EXISTS es_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  signature_id UUID REFERENCES es_signatures(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE es_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON es_campaigns
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON es_campaigns
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

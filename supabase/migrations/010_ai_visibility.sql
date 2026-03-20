-- ============================================
-- 010: AI Visibility Tracker tables
-- ============================================

-- 1. Keywords table
CREATE TABLE ai_visibility_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword text NOT NULL,
  category text CHECK (category IN ('listing management', 'reputation', 'local SEO', 'social/pages', 'competitive')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Runs table
CREATE TABLE ai_visibility_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz,
  completed_at timestamptz,
  status text CHECK (status IN ('pending', 'running', 'completed', 'failed')) DEFAULT 'pending',
  total_keywords integer,
  models_queried text[],
  reps_per_keyword integer DEFAULT 3,
  estimated_cost numeric(10,4),
  trigger_source text CHECK (trigger_source IN ('manual', 'scheduled')),
  schedule_frequency text CHECK (schedule_frequency IN ('daily', '2x-week', 'weekly', 'manual'))
);

-- 3. Results table
CREATE TABLE ai_visibility_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid REFERENCES ai_visibility_runs(id) ON DELETE CASCADE,
  keyword_id uuid REFERENCES ai_visibility_keywords(id) ON DELETE CASCADE,
  keyword_text text,
  model text,
  repetition integer,
  full_response text,
  synup_mentioned boolean,
  synup_position integer,
  synup_urls_cited text[],
  competitors_data jsonb,
  all_urls_found text[],
  response_tokens integer,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_ai_results_run_id ON ai_visibility_results(run_id);
CREATE INDEX idx_ai_results_keyword_id ON ai_visibility_results(keyword_id);
CREATE INDEX idx_ai_results_model ON ai_visibility_results(model);
CREATE INDEX idx_ai_results_created_at ON ai_visibility_results(created_at);
CREATE INDEX idx_ai_keywords_category ON ai_visibility_keywords(category);
CREATE INDEX idx_ai_runs_status ON ai_visibility_runs(status);

-- RLS
ALTER TABLE ai_visibility_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_visibility_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_visibility_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users" ON ai_visibility_keywords
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON ai_visibility_runs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON ai_visibility_results
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Updated_at trigger for keywords
CREATE OR REPLACE FUNCTION update_ai_visibility_keywords_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ai_visibility_keywords_updated_at
  BEFORE UPDATE ON ai_visibility_keywords
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_visibility_keywords_updated_at();

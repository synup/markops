-- ============================================================
-- Marketing HQ — Supabase Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- 1. PROFILES (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. AUDIT RUNS (one row per weekly audit execution)
CREATE TABLE public.audit_runs (
  id BIGSERIAL PRIMARY KEY,
  run_date DATE NOT NULL,
  score DECIMAL(5,2) NOT NULL,
  grade VARCHAR(2) NOT NULL,
  total_checks INT DEFAULT 74,
  passed_checks INT NOT NULL,
  failed_checks INT NOT NULL,
  categories JSONB NOT NULL,       -- {name, score, weight, checks[]}
  critical_issues JSONB DEFAULT '[]',
  quick_wins JSONB DEFAULT '[]',
  account_summary JSONB DEFAULT '{}',
  raw_report JSONB,                -- full audit JSON for deep-dive
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_runs_date ON public.audit_runs (run_date DESC);

-- 3. NEGATIVE KEYWORD CANDIDATES (from search term analysis)
CREATE TABLE public.negative_keywords (
  id BIGSERIAL PRIMARY KEY,
  audit_run_id BIGINT REFERENCES public.audit_runs(id),
  term TEXT NOT NULL,
  campaign TEXT NOT NULL,
  ad_group TEXT,
  match_type TEXT DEFAULT 'exact',
  category TEXT,                    -- job_seekers, free_seekers, etc.
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  cost DECIMAL(10,2) DEFAULT 0,
  conversions INT DEFAULT 0,
  status TEXT DEFAULT 'candidate' CHECK (status IN ('candidate', 'approved', 'denied', 'pushed')),
  pushed_at TIMESTAMPTZ,
  decided_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_neg_kw_status ON public.negative_keywords (status, created_at DESC);

-- 4. KEYWORD EXPANSION CANDIDATES
CREATE TABLE public.keyword_expansions (
  id BIGSERIAL PRIMARY KEY,
  audit_run_id BIGINT REFERENCES public.audit_runs(id),
  term TEXT NOT NULL,
  campaign TEXT NOT NULL,
  clicks INT DEFAULT 0,
  conversions INT DEFAULT 0,
  cpa DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'candidate' CHECK (status IN ('candidate', 'approved', 'denied', 'pushed')),
  pushed_at TIMESTAMPTZ,
  decided_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. KEYWORDS TO PAUSE
CREATE TABLE public.keywords_to_pause (
  id BIGSERIAL PRIMARY KEY,
  audit_run_id BIGINT REFERENCES public.audit_runs(id),
  keyword TEXT NOT NULL,
  campaign TEXT NOT NULL,
  ad_group TEXT,
  reason TEXT,
  spend DECIMAL(10,2) DEFAULT 0,
  quality_score INT,
  conversions INT DEFAULT 0,
  status TEXT DEFAULT 'candidate' CHECK (status IN ('candidate', 'approved', 'denied', 'pushed')),
  pushed_at TIMESTAMPTZ,
  decided_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. CAMPAIGN METRICS (live / daily snapshot)
CREATE TABLE public.campaign_metrics (
  id BIGSERIAL PRIMARY KEY,
  snapshot_date DATE NOT NULL,
  campaign_id TEXT NOT NULL,
  campaign_name TEXT NOT NULL,
  campaign_type TEXT,
  status TEXT,
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  cost DECIMAL(12,2) DEFAULT 0,
  conversions DECIMAL(10,2) DEFAULT 0,
  conv_value DECIMAL(12,2) DEFAULT 0,
  ctr DECIMAL(8,4) DEFAULT 0,
  cpc DECIMAL(10,2) DEFAULT 0,
  conv_rate DECIMAL(8,4) DEFAULT 0,
  roas DECIMAL(8,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_campaign_date ON public.campaign_metrics (snapshot_date DESC, campaign_id);

-- 7. CHANGE LOG (pushed changes to Google Ads)
CREATE TABLE public.change_log (
  id BIGSERIAL PRIMARY KEY,
  change_type TEXT NOT NULL,         -- 'negative_keyword', 'keyword_add', 'keyword_pause'
  details JSONB NOT NULL,
  commit_message TEXT,
  pushed_by UUID REFERENCES public.profiles(id),
  pushed_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.negative_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keyword_expansions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keywords_to_pause ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.change_log ENABLE ROW LEVEL SECURITY;

-- All authenticated @synup.com users can read everything
CREATE POLICY "Authenticated users can read profiles"
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Authenticated users can read audit_runs"
  ON public.audit_runs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role can insert audit_runs"
  ON public.audit_runs FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Authenticated users can read negative_keywords"
  ON public.negative_keywords FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can update negative_keywords"
  ON public.negative_keywords FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Service role can insert negative_keywords"
  ON public.negative_keywords FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Authenticated users can read keyword_expansions"
  ON public.keyword_expansions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can update keyword_expansions"
  ON public.keyword_expansions FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Service role can insert keyword_expansions"
  ON public.keyword_expansions FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Authenticated users can read keywords_to_pause"
  ON public.keywords_to_pause FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can update keywords_to_pause"
  ON public.keywords_to_pause FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Service role can insert keywords_to_pause"
  ON public.keywords_to_pause FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Authenticated users can read campaign_metrics"
  ON public.campaign_metrics FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role can insert campaign_metrics"
  ON public.campaign_metrics FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Authenticated users can read change_log"
  ON public.change_log FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert change_log"
  ON public.change_log FOR INSERT TO authenticated WITH CHECK (true);

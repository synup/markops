-- ============================================================
-- Migration 002: Search terms table + Audit requests table
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. AUDIT REQUESTS (trigger audits from dashboard)
CREATE TABLE public.audit_requests (
  id BIGSERIAL PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  requested_by UUID REFERENCES public.profiles(id),
  requested_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  audit_run_id BIGINT REFERENCES public.audit_runs(id),
  error_message TEXT
);

CREATE INDEX idx_audit_requests_status ON public.audit_requests (status, requested_at DESC);

-- 2. SEARCH TERMS (full search term data per audit)
CREATE TABLE public.search_terms (
  id BIGSERIAL PRIMARY KEY,
  audit_run_id BIGINT REFERENCES public.audit_runs(id),
  search_term TEXT NOT NULL,
  campaign TEXT NOT NULL,
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  cost DECIMAL(10,2) DEFAULT 0,
  conversions DECIMAL(10,2) DEFAULT 0,
  ctr DECIMAL(8,4) DEFAULT 0,
  cpa DECIMAL(10,2),
  categories TEXT[],              -- intent categories (job_seekers, free, etc.)
  reasons TEXT[],                 -- why flagged
  suggested_match_type TEXT,      -- EXACT, PHRASE, BROAD
  priority_score DECIMAL(8,2),
  term_type TEXT DEFAULT 'neutral' CHECK (term_type IN ('negative_candidate', 'expansion_candidate', 'wasted_spend', 'neutral')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_search_terms_audit ON public.search_terms (audit_run_id, term_type);
CREATE INDEX idx_search_terms_campaign ON public.search_terms (campaign, term_type);

-- 3. SEARCH TERM SUMMARY (per-audit aggregate stats)
CREATE TABLE public.search_term_summaries (
  id BIGSERIAL PRIMARY KEY,
  audit_run_id BIGINT REFERENCES public.audit_runs(id) UNIQUE,
  total_terms INT DEFAULT 0,
  total_cost DECIMAL(12,2) DEFAULT 0,
  total_conversions DECIMAL(10,2) DEFAULT 0,
  wasted_spend DECIMAL(12,2) DEFAULT 0,
  negative_candidates_count INT DEFAULT 0,
  expansion_candidates_count INT DEFAULT 0,
  category_breakdown JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. RLS POLICIES
ALTER TABLE public.audit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_term_summaries ENABLE ROW LEVEL SECURITY;

-- Audit requests: authenticated users can read and create
CREATE POLICY "Authenticated users can read audit_requests"
  ON public.audit_requests FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert audit_requests"
  ON public.audit_requests FOR INSERT TO authenticated WITH CHECK (true);

-- Service role can update audit_requests (droplet marks them running/completed)
CREATE POLICY "Service role can update audit_requests"
  ON public.audit_requests FOR UPDATE TO service_role USING (true);

-- Search terms: authenticated read, service role write
CREATE POLICY "Authenticated users can read search_terms"
  ON public.search_terms FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role can insert search_terms"
  ON public.search_terms FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Authenticated users can read search_term_summaries"
  ON public.search_term_summaries FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role can insert search_term_summaries"
  ON public.search_term_summaries FOR INSERT TO service_role WITH CHECK (true);

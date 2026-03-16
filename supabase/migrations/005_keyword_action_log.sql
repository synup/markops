-- Migration 005: Keyword action log for audit trail + undo support
-- Run in Supabase SQL Editor

-- 1. Action log table
CREATE TABLE public.keyword_action_log (
  id BIGSERIAL PRIMARY KEY,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'added_as_candidate', 'approved', 'denied', 'undone',
    'bulk_approved', 'bulk_denied', 'pushed_to_ads'
  )),
  keyword_table TEXT NOT NULL DEFAULT 'negative_keywords',  -- which table was affected
  keyword_id BIGINT NOT NULL,                               -- ID of the keyword row
  term TEXT NOT NULL,                                        -- the keyword text (for display)
  campaign TEXT,                                             -- campaign context
  previous_status TEXT,                                      -- status before this action
  new_status TEXT,                                           -- status after this action
  performed_by UUID REFERENCES public.profiles(id),
  performed_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'                                -- extra context (match_type, cost, etc.)
);

CREATE INDEX idx_action_log_time ON public.keyword_action_log (performed_at DESC);
CREATE INDEX idx_action_log_keyword ON public.keyword_action_log (keyword_id, keyword_table);

-- 2. RLS policies
ALTER TABLE public.keyword_action_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read action log"
  ON public.keyword_action_log FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert action log"
  ON public.keyword_action_log FOR INSERT TO authenticated WITH CHECK (true);

-- 3. Ensure authenticated users can insert negative_keywords (may already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'negative_keywords'
      AND policyname = 'Authenticated users can insert negative_keywords'
  ) THEN
    EXECUTE 'CREATE POLICY "Authenticated users can insert negative_keywords"
      ON public.negative_keywords FOR INSERT TO authenticated WITH CHECK (true)';
  END IF;
END $$;

-- 4. Add decided_at timestamp to negative_keywords (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'negative_keywords' AND column_name = 'decided_at'
  ) THEN
    ALTER TABLE public.negative_keywords ADD COLUMN decided_at TIMESTAMPTZ;
  END IF;
END $$;

-- Migration 006: Push requests table for triggering Push-to-Ads from dashboard
-- Run in Supabase SQL Editor

CREATE TABLE public.push_requests (
  id BIGSERIAL PRIMARY KEY,
  requested_by UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  keyword_count INT DEFAULT 0,
  pushed_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  error_log TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.push_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read push requests"
  ON public.push_requests FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert push requests"
  ON public.push_requests FOR INSERT TO authenticated WITH CHECK (true);

-- Service role updates status (from droplet)
CREATE POLICY "Service role can update push requests"
  ON public.push_requests FOR UPDATE USING (true) WITH CHECK (true);

-- Also ensure authenticated users can update negative_keywords status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'negative_keywords'
      AND policyname = 'Authenticated users can update negative_keywords'
  ) THEN
    EXECUTE 'CREATE POLICY "Authenticated users can update negative_keywords"
      ON public.negative_keywords FOR UPDATE TO authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

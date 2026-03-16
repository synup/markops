-- Migration 007: Add unique constraint for campaign_metrics upsert
-- Run in Supabase SQL Editor

-- Add unique constraint so daily metric fetcher can upsert
ALTER TABLE public.campaign_metrics
  ADD CONSTRAINT unique_campaign_date UNIQUE (snapshot_date, campaign_id);

-- Service role needs update permission for upserts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'campaign_metrics'
      AND policyname = 'Service role can update campaign_metrics'
  ) THEN
    EXECUTE 'CREATE POLICY "Service role can update campaign_metrics"
      ON public.campaign_metrics FOR UPDATE TO service_role USING (true) WITH CHECK (true)';
  END IF;
END $$;

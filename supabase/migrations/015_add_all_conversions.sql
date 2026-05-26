ALTER TABLE public.campaign_metrics
  ADD COLUMN IF NOT EXISTS all_conversions NUMERIC,
  ADD COLUMN IF NOT EXISTS all_conv_value NUMERIC;

COMMENT ON COLUMN public.campaign_metrics.conversions IS
  'Primary conversions only (from metrics.conversions API field — counts conversion actions marked primary for goal). Used for Smart Bidding and default reporting.';
COMMENT ON COLUMN public.campaign_metrics.conv_value IS
  'Primary conversion value (from metrics.conversions_value API field).';
COMMENT ON COLUMN public.campaign_metrics.all_conversions IS
  'All conversions including secondary/non-primary actions (from metrics.all_conversions API field).';
COMMENT ON COLUMN public.campaign_metrics.all_conv_value IS
  'All conversions value including secondary actions (from metrics.all_conversions_value API field).';

-- Migration 012: Content Intelligence Workflow — sales_calls + call_insights
-- Spec: ~/Downloads/Claude Docs/content-intelligence-workflow-2026-04-23.md
-- Phase 1, Step 1 of the Sales HQ → Marketing HQ content intelligence pipeline.
--
-- sales_calls    : ingested Sales HQ meetings (summary + metadata; transcript on demand)
-- call_insights  : LLM extraction output (attribution, problem, asset type, /25 score)
--
-- Access control is enforced at the app layer (admin-only, profiles.role = 'admin').

create table sales_calls (
  id uuid primary key default gen_random_uuid(),
  external_meeting_id text unique not null,
  title text,
  meet_link text,
  rep_email text,
  rep_name text,                          -- derived from organizer_email at ingest (title-case)
  customer_name text,
  customer_company text,
  customer_email text,
  call_date timestamptz not null,
  call_duration_seconds int,
  pipeline text,                          -- raw Sales HQ pipeline value
  conversation_type text not null,        -- sales | cs
  status text not null,                   -- completed | processing | failed | pending
  crm_fields jsonb,                       -- summary.structured_data.crm_fields
  raw_list_payload jsonb,                 -- full list-endpoint response (includes summary.content)
  raw_detail_payload jsonb,               -- populated on-demand if reviewer opens transcript
  ingested_at timestamptz default now(),
  processed_at timestamptz,               -- set when call_insights extraction completes
  constraint sales_calls_conversation_type_check
    check (conversation_type in ('sales','cs')),
  constraint sales_calls_status_check
    check (status in ('completed','processing','failed','pending'))
);

create index idx_sales_calls_processed on sales_calls (processed_at) where processed_at is null;
create index idx_sales_calls_call_date on sales_calls (call_date desc);
create index idx_sales_calls_conversation_type on sales_calls (conversation_type);
create index idx_sales_calls_rep on sales_calls (rep_email);

create table call_insights (
  id uuid primary key default gen_random_uuid(),
  call_id uuid references sales_calls(id) on delete cascade,
  attribution_category text,              -- 13-enum taxonomy (see CHECK below), nullable
  attribution_detail text,                -- free text: "Google", "ChatGPT", "Mike Blumenthal", etc.
  attribution_asked boolean,              -- false = rep compliance miss
  attribution_confidence numeric(3,2),
  problem_statement text,                 -- 2–3 sentence detailed summary
  problem_specificity_score int,          -- 1–5
  suggested_asset_type text,              -- use_case | deep_article | blog_post | collateral | tool
  asset_rationale text,
  icp_fit_score int,                      -- 1–5
  problem_clarity_score int,              -- 1–5
  reusability_score int,                  -- 1–5
  novelty_score int,                      -- 1–5
  composite_score int,                    -- sum of 5 dimensions, /25; ≥18 auto-surfaces as "High value"
  extracted_at timestamptz default now(),
  model_version text,
  constraint call_insights_attribution_category_check
    check (attribution_category in (
      'search','ai_assistant','linkedin','social','review_site',
      'referral','partner','event','podcast','cold_outreach',
      'content','other','unknown'
    ) or attribution_category is null),
  constraint call_insights_asset_type_check
    check (suggested_asset_type in (
      'use_case','deep_article','blog_post','collateral','tool'
    ) or suggested_asset_type is null)
);

create index idx_call_insights_call on call_insights (call_id);
create index idx_call_insights_score on call_insights (composite_score desc);

-- ============================================================
-- ROW LEVEL SECURITY (admin-only read; droplet workers use service_role and bypass RLS)
-- ============================================================
ALTER TABLE public.sales_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read sales_calls"
  ON public.sales_calls FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can read call_insights"
  ON public.call_insights FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ));

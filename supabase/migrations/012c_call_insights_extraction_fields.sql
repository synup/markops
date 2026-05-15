-- ============================================================
-- Migration 012c: extraction agent + approval workflow
-- ============================================================
-- Adds 9 columns to call_insights:
--   5 for extraction outputs (marketing_summary, customer_verbatim,
--     suggested_conversation_type, conversation_type_confidence,
--     suggested_author)
--   4 for approval workflow (review_status, reviewed_at,
--     approved_asset_type, rejection_reason)
-- Plus 5 CHECK constraint updates and UNIQUE on call_id.
-- Idempotent: safe to re-run.

-- Columns (idempotent)
alter table call_insights add column if not exists marketing_summary text;
alter table call_insights add column if not exists customer_verbatim jsonb;
alter table call_insights add column if not exists suggested_conversation_type text;
alter table call_insights add column if not exists conversation_type_confidence numeric(3,2);
alter table call_insights add column if not exists suggested_author text;
alter table call_insights add column if not exists review_status text default 'pending';
alter table call_insights add column if not exists reviewed_at timestamptz;
alter table call_insights add column if not exists approved_asset_type text;
alter table call_insights add column if not exists rejection_reason text;

-- Constraints (drop-if-exists + add = idempotent)
alter table call_insights drop constraint if exists call_insights_asset_type_check;
alter table call_insights drop constraint if exists call_insights_suggested_asset_type_check;
alter table call_insights add constraint call_insights_suggested_asset_type_check
  check (suggested_asset_type in ('blog_post','deep_article','use_case','collateral','tool','thought_leadership')
         or suggested_asset_type is null);

alter table call_insights drop constraint if exists call_insights_suggested_conversation_type_check;
alter table call_insights add constraint call_insights_suggested_conversation_type_check
  check (suggested_conversation_type in ('sales','cs','unknown')
         or suggested_conversation_type is null);

alter table call_insights drop constraint if exists call_insights_suggested_author_check;
alter table call_insights add constraint call_insights_suggested_author_check
  check (suggested_author in ('sudy','roshan','niladri')
         or suggested_author is null);

alter table call_insights drop constraint if exists call_insights_review_status_check;
alter table call_insights add constraint call_insights_review_status_check
  check (review_status in ('pending','approved','rejected'));

alter table call_insights drop constraint if exists call_insights_approved_asset_type_check;
alter table call_insights add constraint call_insights_approved_asset_type_check
  check (approved_asset_type in ('blog_post','deep_article','use_case','collateral','tool','thought_leadership')
         or approved_asset_type is null);

alter table call_insights drop constraint if exists call_insights_call_id_unique;
alter table call_insights add constraint call_insights_call_id_unique unique (call_id);

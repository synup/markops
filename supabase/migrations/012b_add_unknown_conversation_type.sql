-- Migration 012b: Allow 'unknown' as a conversation_type value.
-- Some Sales HQ meetings have summary.structured_data.pipeline = null
-- (recent, unclassified, or genuine signal Sudy's classifier missed).
-- We ingest these with conversation_type='unknown' so Phase 2 extraction
-- can classify or surface them for human review, rather than dropping
-- ~45% of meetings silently.

alter table sales_calls drop constraint sales_calls_conversation_type_check;
alter table sales_calls add constraint sales_calls_conversation_type_check
  check (conversation_type in ('sales','cs','unknown'));

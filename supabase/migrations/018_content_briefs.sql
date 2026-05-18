-- Migration 018: content_briefs table for Phase 3b brief generation
-- Stores generated briefs for long-form asset types only
-- Thought_leadership drafts live in content_drafts (Phase 3c)

CREATE TABLE IF NOT EXISTS content_briefs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_insight_id UUID NOT NULL REFERENCES call_insights(id) ON DELETE CASCADE,
    asset_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    brief_content TEXT,
    prompt_used TEXT,
    model_version TEXT,
    generation_metadata JSONB,
    error_message TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    ready_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT content_briefs_asset_type_check
        CHECK (asset_type IN ('blog_post', 'deep_article', 'use_case', 'collateral', 'tool')),
    CONSTRAINT content_briefs_status_check
        CHECK (status IN ('pending', 'generating', 'ready', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_content_briefs_status ON content_briefs(status);
CREATE INDEX IF NOT EXISTS idx_content_briefs_call_insight_id ON content_briefs(call_insight_id);

CREATE OR REPLACE FUNCTION update_content_briefs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS content_briefs_updated_at_trigger ON content_briefs;
CREATE TRIGGER content_briefs_updated_at_trigger
    BEFORE UPDATE ON content_briefs
    FOR EACH ROW
    EXECUTE FUNCTION update_content_briefs_updated_at();

COMMENT ON TABLE content_briefs IS 'Phase 3b: generated briefs for long-form asset types. Worker on droplet polls status=pending to process.';

-- Migration 008: Reddit Research Tool tables
-- Status: Already run in Supabase (added to repo for version control)

-- Feed sources: subreddits and keyword searches to monitor
CREATE TABLE IF NOT EXISTS reddit_feed_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_type TEXT NOT NULL CHECK (feed_type IN ('subreddit', 'keyword_search')),
  value TEXT NOT NULL,
  label TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_preference TEXT,
  time_filter TEXT,
  added_by TEXT,
  notes TEXT,
  last_polled_at TIMESTAMPTZ,
  post_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  UNIQUE (feed_type, value)
);

-- Raw Reddit posts fetched from feed sources
CREATE TABLE IF NOT EXISTS reddit_posts (
  id SERIAL PRIMARY KEY,
  feed_source_id INTEGER REFERENCES reddit_feed_sources(id) ON DELETE SET NULL,
  reddit_id TEXT UNIQUE NOT NULL,
  subreddit TEXT NOT NULL,
  title TEXT NOT NULL,
  selftext TEXT,
  author TEXT NOT NULL,
  url TEXT NOT NULL,
  permalink TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  num_comments INTEGER NOT NULL DEFAULT 0,
  created_utc TIMESTAMPTZ NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tool idea scores (tool_request / pain_point classification)
CREATE TABLE IF NOT EXISTS reddit_tool_scores (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES reddit_posts(id) ON DELETE CASCADE,
  relevance_score NUMERIC NOT NULL DEFAULT 0,
  pain_level NUMERIC NOT NULL DEFAULT 0,
  tool_fit NUMERIC NOT NULL DEFAULT 0,
  total_score NUMERIC NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'tool_request',
  reasoning TEXT,
  scored_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id)
);

-- Content idea scores (ICP match, content potential, cluster)
CREATE TABLE IF NOT EXISTS reddit_content_scores (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES reddit_posts(id) ON DELETE CASCADE,
  icp_match NUMERIC NOT NULL DEFAULT 0,
  content_potential NUMERIC NOT NULL DEFAULT 0,
  cluster TEXT,
  brief TEXT,
  total_score NUMERIC NOT NULL DEFAULT 0,
  scored_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id)
);

-- Actions on tool ideas (approve / reject)
CREATE TABLE IF NOT EXISTS reddit_tool_actions (
  id SERIAL PRIMARY KEY,
  tool_score_id INTEGER NOT NULL REFERENCES reddit_tool_scores(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('approved', 'rejected')),
  assigned_to TEXT,
  notes TEXT,
  acted_by UUID REFERENCES auth.users(id),
  acted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Actions on content ideas (approve / reject)
CREATE TABLE IF NOT EXISTS reddit_content_actions (
  id SERIAL PRIMARY KEY,
  content_score_id INTEGER NOT NULL REFERENCES reddit_content_scores(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('approved', 'rejected')),
  brief_status TEXT,
  notes TEXT,
  acted_by UUID REFERENCES auth.users(id),
  acted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Subreddit suggestions (auto-discovered or manually suggested)
CREATE TABLE IF NOT EXISTS reddit_subreddit_suggestions (
  id SERIAL PRIMARY KEY,
  subreddit TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  suggested_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE reddit_feed_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE reddit_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reddit_tool_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE reddit_content_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE reddit_tool_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reddit_content_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reddit_subreddit_suggestions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all reddit tables
CREATE POLICY "Authenticated users can read reddit_feed_sources" ON reddit_feed_sources FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read reddit_posts" ON reddit_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read reddit_tool_scores" ON reddit_tool_scores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read reddit_content_scores" ON reddit_content_scores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read reddit_tool_actions" ON reddit_tool_actions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read reddit_content_actions" ON reddit_content_actions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read reddit_subreddit_suggestions" ON reddit_subreddit_suggestions FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to insert actions
CREATE POLICY "Authenticated users can insert reddit_tool_actions" ON reddit_tool_actions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert reddit_content_actions" ON reddit_content_actions FOR INSERT TO authenticated WITH CHECK (true);

-- Allow authenticated users to manage feed sources
CREATE POLICY "Authenticated users can insert reddit_feed_sources" ON reddit_feed_sources FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update reddit_feed_sources" ON reddit_feed_sources FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete reddit_feed_sources" ON reddit_feed_sources FOR DELETE TO authenticated USING (true);

-- Allow authenticated users to manage subreddit suggestions
CREATE POLICY "Authenticated users can update reddit_subreddit_suggestions" ON reddit_subreddit_suggestions FOR UPDATE TO authenticated USING (true);

-- Allow service_role to do everything (for the fetcher/scorer scripts)
CREATE POLICY "Service role full access feed_sources" ON reddit_feed_sources FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access posts" ON reddit_posts FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access tool_scores" ON reddit_tool_scores FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access content_scores" ON reddit_content_scores FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access subreddit_suggestions" ON reddit_subreddit_suggestions FOR ALL TO service_role USING (true);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_reddit_posts_subreddit ON reddit_posts(subreddit);
CREATE INDEX IF NOT EXISTS idx_reddit_posts_fetched_at ON reddit_posts(fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_reddit_tool_scores_total ON reddit_tool_scores(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_reddit_content_scores_total ON reddit_content_scores(total_score DESC);

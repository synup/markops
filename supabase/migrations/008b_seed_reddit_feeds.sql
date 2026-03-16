-- Migration 008b: Seed initial Reddit feed sources
-- Status: Already run in Supabase (added to repo for version control)
-- 30 feed sources: 10 subreddits + 20 keyword searches

-- Subreddits
INSERT INTO reddit_feed_sources (type, value) VALUES
  ('subreddit', 'smallbusiness'),
  ('subreddit', 'digital_marketing'),
  ('subreddit', 'PPC'),
  ('subreddit', 'SEO'),
  ('subreddit', 'marketing'),
  ('subreddit', 'Entrepreneur'),
  ('subreddit', 'SaaS'),
  ('subreddit', 'startups'),
  ('subreddit', 'advertising'),
  ('subreddit', 'local_business')
ON CONFLICT (type, value) DO NOTHING;

-- Keyword searches
INSERT INTO reddit_feed_sources (type, value) VALUES
  ('keyword', 'google ads audit'),
  ('keyword', 'google ads optimization'),
  ('keyword', 'ppc audit tool'),
  ('keyword', 'wasted ad spend'),
  ('keyword', 'google ads negative keywords'),
  ('keyword', 'adwords management tool'),
  ('keyword', 'local business marketing'),
  ('keyword', 'google ads reporting'),
  ('keyword', 'ppc management software'),
  ('keyword', 'google ads automation'),
  ('keyword', 'marketing audit'),
  ('keyword', 'digital marketing tools'),
  ('keyword', 'local seo tools'),
  ('keyword', 'listing management'),
  ('keyword', 'reputation management software'),
  ('keyword', 'review management tool'),
  ('keyword', 'business listing tool'),
  ('keyword', 'marketing analytics dashboard'),
  ('keyword', 'ad spend optimization'),
  ('keyword', 'campaign management tool')
ON CONFLICT (type, value) DO NOTHING;

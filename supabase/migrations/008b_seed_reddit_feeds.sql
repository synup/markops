-- Migration 008b: Seed initial Reddit feed sources
-- Status: Already run in Supabase (added to repo for version control)
-- 30 feed sources: 10 subreddits + 20 keyword searches

-- Subreddits
INSERT INTO reddit_feed_sources (feed_type, value, label) VALUES
  ('subreddit', 'localSEO', 'Local SEO community'),
  ('subreddit', 'googleMyBusiness', 'Google Business Profile'),
  ('subreddit', 'smallbusiness', 'Small business owners'),
  ('subreddit', 'marketing', 'General marketing'),
  ('subreddit', 'SEO', 'SEO professionals'),
  ('subreddit', 'digital_marketing', 'Digital marketing'),
  ('subreddit', 'Entrepreneur', 'Entrepreneurs'),
  ('subreddit', 'SideProject', 'Side projects & indie hackers'),
  ('subreddit', 'webdev', 'Web development'),
  ('subreddit', 'SaaS', 'SaaS builders & users')
ON CONFLICT (feed_type, value) DO NOTHING;

-- Keyword searches
INSERT INTO reddit_feed_sources (feed_type, value, label) VALUES
  ('keyword_search', 'synup', 'Brand mentions'),
  ('keyword_search', 'synup reviews', 'Brand reviews'),
  ('keyword_search', 'synup alternative', 'Brand alternatives'),
  ('keyword_search', 'synup vs', 'Brand comparisons'),
  ('keyword_search', 'listing management tool', 'Listing tools'),
  ('keyword_search', 'reputation management software', 'Reputation tools'),
  ('keyword_search', 'review management tool', 'Review tools'),
  ('keyword_search', 'local seo tools', 'Local SEO tools'),
  ('keyword_search', 'yext alternative', 'Yext competitor'),
  ('keyword_search', 'birdeye vs', 'Birdeye competitor'),
  ('keyword_search', 'podium alternative', 'Podium competitor'),
  ('keyword_search', 'moz local alternative', 'Moz Local competitor'),
  ('keyword_search', 'best local seo tool', 'Local SEO intent'),
  ('keyword_search', 'google ads audit tool', 'Audit intent'),
  ('keyword_search', 'ppc management software', 'PPC intent'),
  ('keyword_search', 'marketing analytics dashboard', 'Analytics intent'),
  ('keyword_search', 'wasted ad spend', 'Ad waste pain'),
  ('keyword_search', 'google ads not working', 'Ads pain'),
  ('keyword_search', 'bad google reviews', 'Review pain'),
  ('keyword_search', 'wrong business listing', 'Listing pain')
ON CONFLICT (feed_type, value) DO NOTHING;

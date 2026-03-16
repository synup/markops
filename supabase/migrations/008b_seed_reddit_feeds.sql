-- Migration 008b: Seed initial Reddit feed sources
-- Status: Already run in Supabase (added to repo for version control)
-- 30 feed sources: 10 subreddits + 20 keyword searches across 5 categories

-- Subreddits
INSERT INTO reddit_feed_sources (type, value, label, category) VALUES
  ('subreddit', 'localSEO', 'Local SEO community', NULL),
  ('subreddit', 'googleMyBusiness', 'Google Business Profile', NULL),
  ('subreddit', 'smallbusiness', 'Small business owners', NULL),
  ('subreddit', 'marketing', 'General marketing', NULL),
  ('subreddit', 'SEO', 'SEO professionals', NULL),
  ('subreddit', 'digital_marketing', 'Digital marketing', NULL),
  ('subreddit', 'Entrepreneur', 'Entrepreneurs', NULL),
  ('subreddit', 'SideProject', 'Side projects & indie hackers', NULL),
  ('subreddit', 'webdev', 'Web development', NULL),
  ('subreddit', 'SaaS', 'SaaS builders & users', NULL)
ON CONFLICT (type, value) DO NOTHING;

-- Brand Monitoring keywords
INSERT INTO reddit_feed_sources (type, value, label, category) VALUES
  ('keyword', 'synup', 'Brand mentions', 'brand_monitoring'),
  ('keyword', 'synup reviews', 'Brand reviews', 'brand_monitoring'),
  ('keyword', 'synup alternative', 'Brand alternatives', 'brand_monitoring'),
  ('keyword', 'synup vs', 'Brand comparisons', 'brand_monitoring')
ON CONFLICT (type, value) DO NOTHING;

-- Category keywords
INSERT INTO reddit_feed_sources (type, value, label, category) VALUES
  ('keyword', 'listing management tool', 'Listing tools', 'category'),
  ('keyword', 'reputation management software', 'Reputation tools', 'category'),
  ('keyword', 'review management tool', 'Review tools', 'category'),
  ('keyword', 'local seo tools', 'Local SEO tools', 'category')
ON CONFLICT (type, value) DO NOTHING;

-- Competitor keywords
INSERT INTO reddit_feed_sources (type, value, label, category) VALUES
  ('keyword', 'yext alternative', 'Yext competitor', 'competitor'),
  ('keyword', 'birdeye vs', 'Birdeye competitor', 'competitor'),
  ('keyword', 'podium alternative', 'Podium competitor', 'competitor'),
  ('keyword', 'moz local alternative', 'Moz Local competitor', 'competitor')
ON CONFLICT (type, value) DO NOTHING;

-- Intent keywords
INSERT INTO reddit_feed_sources (type, value, label, category) VALUES
  ('keyword', 'best local seo tool', 'Local SEO intent', 'intent'),
  ('keyword', 'google ads audit tool', 'Audit intent', 'intent'),
  ('keyword', 'ppc management software', 'PPC intent', 'intent'),
  ('keyword', 'marketing analytics dashboard', 'Analytics intent', 'intent')
ON CONFLICT (type, value) DO NOTHING;

-- Pain Point keywords
INSERT INTO reddit_feed_sources (type, value, label, category) VALUES
  ('keyword', 'wasted ad spend', 'Ad waste pain', 'pain_point'),
  ('keyword', 'google ads not working', 'Ads pain', 'pain_point'),
  ('keyword', 'bad google reviews', 'Review pain', 'pain_point'),
  ('keyword', 'wrong business listing', 'Listing pain', 'pain_point')
ON CONFLICT (type, value) DO NOTHING;

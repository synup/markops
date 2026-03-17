// ── Database row types ──────────────────────────────

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: 'admin' | 'editor' | 'viewer'
  created_at: string
}

export interface AuditRun {
  id: number
  run_date: string
  score: number
  grade: string
  total_checks: number
  passed_checks: number
  failed_checks: number
  categories: AuditCategory[]
  critical_issues: AuditIssue[]
  quick_wins: AuditIssue[]
  account_summary: Record<string, unknown>
  created_at: string
}

export interface AuditCategory {
  name: string
  score: number
  weight: number
  checks: AuditCheck[]
}

export interface AuditCheck {
  name: string
  status: 'pass' | 'fail' | 'warning' | 'info'
  message: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
}

export interface AuditIssue {
  title: string
  description: string
  severity: string
  category: string
}

export interface NegativeKeyword {
  id: number
  audit_run_id: number
  term: string
  campaign: string
  ad_group: string | null
  match_type: string
  category: string | null
  impressions: number
  clicks: number
  cost: number
  conversions: number
  status: 'candidate' | 'approved' | 'denied' | 'pushed'
  created_at: string
}

export interface KeywordExpansion {
  id: number
  audit_run_id: number
  term: string
  campaign: string
  clicks: number
  conversions: number
  cpa: number
  status: 'candidate' | 'approved' | 'denied' | 'pushed'
  created_at: string
}

export interface KeywordToPause {
  id: number
  audit_run_id: number
  keyword: string
  campaign: string
  ad_group: string | null
  reason: string | null
  spend: number
  quality_score: number | null
  conversions: number
  status: 'candidate' | 'approved' | 'denied' | 'pushed'
  created_at: string
}

export interface CampaignMetric {
  id: number
  snapshot_date: string
  campaign_id: string
  campaign_name: string
  campaign_type: string | null
  status: string | null
  impressions: number
  clicks: number
  cost: number
  conversions: number
  conv_value: number
  ctr: number
  cpc: number
  conv_rate: number
  roas: number
}

export interface ChangeLogEntry {
  id: number
  change_type: string
  details: Record<string, unknown>
  commit_message: string | null
  pushed_by: string | null
  pushed_at: string
}

// ── Reddit Research types ───────────────────────────

export interface RedditFeedSource {
  id: string
  feed_type: 'subreddit' | 'keyword_search'
  value: string
  label: string | null
  enabled: boolean
  sort_preference: string | null
  time_filter: string | null
  added_by: string | null
  notes: string | null
  last_polled_at: string | null
  post_count: number
  created_at: string
  updated_at: string | null
}

export interface RedditPost {
  id: string
  feed_source_id: string | null
  reddit_id: string
  subreddit: string
  title: string
  selftext: string | null
  summary: string | null
  author: string
  url: string
  upvotes: number
  num_comments: number
  flair: string | null
  is_self: boolean
  matched_keywords: string[] | null
  source_type: string | null
  source_label: string | null
  category: string | null
  enriched: boolean
  published_at: string | null
  collected_at: string
}

export interface RedditToolScore {
  id: string
  post_id: string
  relevance_score: number
  intent_score: number
  engagement_score: number
  recency_score: number
  competitive_gap_score: number
  composite_score: number
  build_complexity: string | null
  estimated_build_hours: number | null
  tool_type: string | null
  similar_tools_exist: boolean | null
  similar_tools_notes: string | null
  action_rationale: string | null
}

export interface RedditContentScore {
  id: string
  post_id: string
  relevance_score: number
  search_demand_score: number
  engagement_score: number
  recency_score: number
  competitive_gap_score: number
  composite_score: number
  icp_match: boolean
  content_cluster: string | null
  cluster_match_score: number | null
  existing_blog_overlap: boolean | null
  content_type: string | null
  target_keywords: string[] | null
  action_rationale: string | null
}

export interface RedditToolAction {
  id: string
  post_id: string
  action: string
  deploy_url: string | null
  notes: string | null
  acted_by: string | null
  acted_at: string
}

export interface RedditContentAction {
  id: string
  post_id: string
  action: string
  brief_url: string | null
  notes: string | null
  acted_by: string | null
  acted_at: string
}

export interface RedditAgentConfig {
  id: string
  agent_name: string
  agent_role: string
  system_prompt: string
  model: string
  temperature: number
  max_tokens: number
  enabled: boolean
  last_modified_by: string | null
  version: number
  created_at: string
  updated_at: string | null
}

export interface RedditFeedbackLog {
  id: string
  post_id: string
  agent_name: string
  feedback_type: string
  from_track: string | null
  to_track: string | null
  original_score: number | null
  original_action: string | null
  feedback_notes: string | null
  performed_by: string | null
  created_at: string
}

export interface RedditSubredditSuggestion {
  id: string
  subreddit: string
  reason: string | null
  discovered_via: string | null
  post_frequency: number | null
  relevance_score: number | null
  status: 'pending' | 'approved' | 'rejected'
  suggested_at: string
}

// ── pSEO Content types ───────────────────────────────

export interface PseoArticle {
  site: string
  contentType: string
  title: string
  slug: string
  fullUrl: string
  targetKeyword: string
  category: string
  toolCount: number
  toolsList: string
  publishedDate: string
  indexerStatus: string
  indexerResponseCode: number
  timestamp: string
}

export interface PseoAnalytics {
  totalArticles: number
  articlesLast7Days: number
  indexingSuccessRate: number
}

export type PseoDateRange = '7d' | '14d' | '1m' | 'all'

export type PseoSortField = keyof PseoArticle

export interface PseoSortConfig {
  field: PseoSortField
  direction: 'asc' | 'desc'
}

export type PseoColumnFilters = Partial<Record<keyof PseoArticle, string>>

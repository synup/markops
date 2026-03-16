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
  id: number
  type: 'subreddit' | 'keyword'
  value: string
  enabled: boolean
  created_at: string
}

export interface RedditPost {
  id: number
  feed_source_id: number
  reddit_id: string
  subreddit: string
  title: string
  selftext: string | null
  author: string
  url: string
  permalink: string
  score: number
  num_comments: number
  created_utc: string
  fetched_at: string
}

export interface RedditToolScore {
  id: number
  post_id: number
  relevance_score: number
  pain_level: number
  tool_fit: number
  total_score: number
  category: string
  reasoning: string | null
  scored_at: string
}

export interface RedditContentScore {
  id: number
  post_id: number
  icp_match: number
  content_potential: number
  cluster: string | null
  brief: string | null
  total_score: number
  scored_at: string
}

export interface RedditToolAction {
  id: number
  tool_score_id: number
  action: 'approved' | 'rejected'
  assigned_to: string | null
  notes: string | null
  acted_by: string | null
  acted_at: string
}

export interface RedditContentAction {
  id: number
  content_score_id: number
  action: 'approved' | 'rejected'
  brief_status: string | null
  notes: string | null
  acted_by: string | null
  acted_at: string
}

export interface RedditSubredditSuggestion {
  id: number
  subreddit: string
  reason: string | null
  status: 'pending' | 'approved' | 'rejected'
  suggested_at: string
}

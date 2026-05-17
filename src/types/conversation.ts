export type ReviewStatus = 'pending' | 'approved' | 'rejected'

export type ConversationType = 'sales' | 'cs' | 'unknown'

export type AttributionCategory =
  | 'search' | 'ai_assistant' | 'linkedin' | 'social' | 'review_site'
  | 'referral' | 'partner' | 'event' | 'podcast' | 'cold_outreach'
  | 'content' | 'other' | 'unknown'

export type SuggestedAssetType =
  | 'blog_post' | 'deep_article' | 'use_case'
  | 'collateral' | 'tool' | 'thought_leadership'

export type SalesCallEmbed = {
  id: string
  external_meeting_id: string
  title: string | null
  call_date: string
  rep_name: string | null
  rep_email: string | null
  customer_name: string | null
  customer_company: string | null
  customer_email: string | null
  pipeline: string | null
  conversation_type: ConversationType
  call_duration_seconds: number | null
  status: string
}

export type ConversationRow = {
  id: string
  call_id: string
  attribution_category: AttributionCategory | null
  attribution_detail: string | null
  attribution_asked: boolean | null
  attribution_confidence: number | null
  problem_statement: string | null
  problem_specificity_score: number | null
  suggested_asset_type: SuggestedAssetType | null
  asset_rationale: string | null
  icp_fit_score: number | null
  problem_clarity_score: number | null
  reusability_score: number | null
  novelty_score: number | null
  composite_score: number | null
  marketing_summary: string | null
  customer_verbatim: string[] | null
  suggested_conversation_type: ConversationType | null
  conversation_type_confidence: number | null
  suggested_author: string | null
  review_status: ReviewStatus
  reviewed_at: string | null
  approved_asset_type: SuggestedAssetType | null
  rejection_reason: string | null
  extracted_at: string
  model_version: string | null
  sales_calls: SalesCallEmbed
}

export type Counts = {
  pending: number
  approved: number
  rejected: number
}

export type ConversationsResponse = {
  rows: ConversationRow[]
  counts: Counts
}

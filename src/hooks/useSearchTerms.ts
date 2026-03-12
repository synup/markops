'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface SearchTerm {
  id: number
  audit_run_id: number
  search_term: string
  campaign: string
  impressions: number
  clicks: number
  cost: number
  conversions: number
  ctr: number
  cpa: number | null
  categories: string[]
  reasons: string[]
  suggested_match_type: string | null
  priority_score: number | null
  term_type: 'negative_candidate' | 'expansion_candidate' | 'wasted_spend' | 'neutral'
}

interface SearchTermSummary {
  total_terms: number
  total_cost: number
  total_conversions: number
  wasted_spend: number
  negative_candidates_count: number
  expansion_candidates_count: number
  category_breakdown: Record<string, { count: number; cost: number }>
}

export function useSearchTerms(auditRunId?: number, campaign?: string) {
  const [terms, setTerms] = useState<SearchTerm[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetch() {
      let query = supabase.from('search_terms').select('*')
      if (auditRunId) query = query.eq('audit_run_id', auditRunId)
      if (campaign) query = query.eq('campaign', campaign)
      query = query.order('cost', { ascending: false }).limit(500)
      const { data } = await query
      setTerms(data ?? [])
      setLoading(false)
    }
    fetch()
  }, [auditRunId, campaign])

  return { terms, loading }
}

export function useSearchTermSummary(auditRunId?: number) {
  const [summary, setSummary] = useState<SearchTermSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetch() {
      if (!auditRunId) { setLoading(false); return }
      const { data } = await supabase
        .from('search_term_summaries')
        .select('*')
        .eq('audit_run_id', auditRunId)
        .single()
      setSummary(data)
      setLoading(false)
    }
    fetch()
  }, [auditRunId])

  return { summary, loading }
}

export function useCampaignList(auditRunId?: number) {
  const [campaigns, setCampaigns] = useState<string[]>([])
  const supabase = createClient()

  useEffect(() => {
    async function fetch() {
      if (!auditRunId) return
      const { data } = await supabase
        .from('search_terms')
        .select('campaign')
        .eq('audit_run_id', auditRunId)
      const unique = [...new Set((data ?? []).map(d => d.campaign))].sort()
      setCampaigns(unique)
    }
    fetch()
  }, [auditRunId])

  return campaigns
}

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CampaignMetric } from '@/types'

interface AuditCampaign {
  name: string
  type?: string
  status?: string
  impressions?: number
  clicks?: number
  cost?: number
  conversions?: number
  conv_value?: number
  ctr?: number
  cpc?: number
  conv_rate?: number
  roas?: number
  budget?: number
  budget_type?: string
}

export function useCampaigns(days: number = 30) {
  const [campaigns, setCampaigns] = useState<CampaignMetric[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetch() {
      const since = new Date()
      since.setDate(since.getDate() - days)
      const { data } = await supabase
        .from('campaign_metrics')
        .select('*')
        .gte('snapshot_date', since.toISOString().split('T')[0])
        .order('snapshot_date', { ascending: false })
      setCampaigns(data ?? [])
      setLoading(false)
    }
    fetch()
  }, [days])

  return { campaigns, loading }
}

export function useLatestCampaignSnapshot() {
  const [campaigns, setCampaigns] = useState<CampaignMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetch() {
      try {
        // First try campaign_metrics table
        const { data: latest } = await supabase
          .from('campaign_metrics')
          .select('snapshot_date')
          .order('snapshot_date', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (latest) {
          const { data } = await supabase
            .from('campaign_metrics')
            .select('*')
            .eq('snapshot_date', latest.snapshot_date)
            .order('cost', { ascending: false })
          setCampaigns(data ?? [])
          setLoading(false)
          return
        }

        // Fallback: extract campaign data from latest audit report
        const { data: auditRun } = await supabase
          .from('audit_runs')
          .select('id, run_date, raw_report')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (auditRun?.raw_report) {
          const report = auditRun.raw_report as Record<string, unknown>
          const campaignData = extractCampaigns(report, auditRun.run_date)
          setCampaigns(campaignData)
        }
      } catch {
        setError('Failed to load campaign data')
      }
      setLoading(false)
    }
    fetch()
  }, [])

  return { campaigns, loading, error }
}

function extractCampaigns(report: Record<string, unknown>, runDate: string): CampaignMetric[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = report as any
  const campaigns: AuditCampaign[] =
    r?.campaign_performance?.campaigns ??
    r?.account_info?.campaigns ??
    r?.campaigns ?? []

  if (!Array.isArray(campaigns) || campaigns.length === 0) return []

  return campaigns.map((c: AuditCampaign, i: number) => ({
    id: i + 1,
    snapshot_date: runDate,
    campaign_id: String(i + 1),
    campaign_name: c.name || 'Unknown Campaign',
    campaign_type: c.type ?? null,
    status: c.status ?? 'ENABLED',
    impressions: c.impressions ?? 0,
    clicks: c.clicks ?? 0,
    cost: c.cost ?? 0,
    conversions: c.conversions ?? 0,
    conv_value: c.conv_value ?? 0,
    ctr: c.ctr ?? (c.impressions ? (c.clicks ?? 0) / c.impressions : 0),
    cpc: c.cpc ?? (c.clicks ? (c.cost ?? 0) / c.clicks : 0),
    conv_rate: c.conv_rate ?? (c.clicks ? (c.conversions ?? 0) / c.clicks : 0),
    roas: c.roas ?? (c.cost ? (c.conv_value ?? 0) / c.cost : 0),
  }))
}

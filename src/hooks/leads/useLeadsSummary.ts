'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { LeadsDailySummary } from '@/types'

interface LeadsSummaryData {
  yesterday: { total: number; book_a_demo: number; contact_us: number }
  period: { total: number; book_a_demo: number; contact_us: number }
  dailyCounts: LeadsDailySummary[]
  topSources: { source: string; count: number }[]
}

const EMPTY: LeadsSummaryData = {
  yesterday: { total: 0, book_a_demo: 0, contact_us: 0 },
  period: { total: 0, book_a_demo: 0, contact_us: 0 },
  dailyCounts: [],
  topSources: [],
}

export function useLeadsSummary(days: number = 7) {
  const [summary, setSummary] = useState<LeadsSummaryData>(EMPTY)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetch() {
      const now = new Date()
      const periodStart = new Date(now)
      periodStart.setDate(periodStart.getDate() - days)

      const yesterdayStart = new Date(now)
      yesterdayStart.setDate(yesterdayStart.getDate() - 1)
      const yesterdayStr = yesterdayStart.toISOString().split('T')[0]

      const { data } = await supabase
        .from('tally_leads')
        .select('form_name, submitted_at, attribution_source')
        .gte('submitted_at', periodStart.toISOString())
        .order('submitted_at', { ascending: true })

      if (!data) { setLoading(false); return }

      const yesterdayLeads = data.filter(d => d.submitted_at.startsWith(yesterdayStr))
      const yesterday = {
        total: yesterdayLeads.length,
        book_a_demo: yesterdayLeads.filter(d => d.form_name === 'Book a Demo').length,
        contact_us: yesterdayLeads.filter(d => d.form_name === 'Contact Us').length,
      }

      const period = {
        total: data.length,
        book_a_demo: data.filter(d => d.form_name === 'Book a Demo').length,
        contact_us: data.filter(d => d.form_name === 'Contact Us').length,
      }

      const byDay: Record<string, LeadsDailySummary> = {}
      for (const d of data) {
        const dateKey = d.submitted_at.split('T')[0]
        if (!byDay[dateKey]) byDay[dateKey] = { date: dateKey, total: 0, book_a_demo: 0, contact_us: 0 }
        byDay[dateKey].total++
        if (d.form_name === 'Book a Demo') byDay[dateKey].book_a_demo++
        else byDay[dateKey].contact_us++
      }
      const dailyCounts = Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date))

      const sourceCounts: Record<string, number> = {}
      for (const d of data) {
        if (d.attribution_source) sourceCounts[d.attribution_source] = (sourceCounts[d.attribution_source] || 0) + 1
      }
      const topSources = Object.entries(sourceCounts)
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      setSummary({ yesterday, period, dailyCounts, topSources })
      setLoading(false)
    }
    fetch()
  }, [days])

  return { summary, loading }
}

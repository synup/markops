'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type {
  AIVisibilityKeyword,
  AIVisibilityRun,
  AIVisibilityResult,
  AIVisibilityCompetitor,
  SynupKeywordSummary,
  CompetitorSummary,
  CompetitorMention,
} from '@/types'

// ---------------------------------------------------------------------------
// Synup aggregation helpers
// ---------------------------------------------------------------------------

function computeSynupSummaries(
  results: AIVisibilityResult[],
  keywords: AIVisibilityKeyword[],
  previousResults: AIVisibilityResult[]
): Record<string, SynupKeywordSummary[]> {
  const models = [...new Set(results.map(r => r.model))]
  const prevByModel = groupByModel(previousResults)
  const summaries: Record<string, SynupKeywordSummary[]> = {}

  for (const model of models) {
    const modelResults = results.filter(r => r.model === model)
    const prevModelResults = prevByModel[model] ?? []

    summaries[model] = keywords.map(kw => {
      const kwResults = modelResults.filter(r => r.keyword_id === kw.id)
      const mentionedCount = kwResults.filter(r => r.synup_mentioned).length
      const mentioned = mentionedCount > 0
      const positions = kwResults
        .filter(r => r.synup_position != null)
        .map(r => r.synup_position!)
      const avgPosition = positions.length > 0
        ? Math.round((positions.reduce((a, b) => a + b, 0) / positions.length) * 10) / 10
        : null

      // Previous run comparison
      const prevKwResults = prevModelResults.filter(r => r.keyword_id === kw.id)
      const prevPositions = prevKwResults
        .filter(r => r.synup_position != null)
        .map(r => r.synup_position!)
      const prevAvg = prevPositions.length > 0
        ? prevPositions.reduce((a, b) => a + b, 0) / prevPositions.length
        : null
      const positionChange = avgPosition != null && prevAvg != null
        ? Math.round((prevAvg - avgPosition) * 10) / 10
        : null

      // Deduplicate cited URLs
      const allUrls = kwResults.flatMap(r => r.synup_urls_cited ?? [])
      const citedUrls = [...new Set(allUrls)]

      return {
        keyword_id: kw.id,
        keyword_text: kw.keyword,
        category: kw.category,
        mentioned,
        avg_position: avgPosition,
        position_change: positionChange,
        cited_urls: citedUrls,
      }
    })
  }

  return summaries
}

// ---------------------------------------------------------------------------
// Competitor aggregation helpers
// ---------------------------------------------------------------------------

function computeCompetitorSummaries(
  results: AIVisibilityResult[],
  competitors: AIVisibilityCompetitor[],
  previousResults: AIVisibilityResult[]
): Record<string, CompetitorSummary[]> {
  const models = [...new Set(results.map(r => r.model))]
  const prevByModel = groupByModel(previousResults)
  const summaries: Record<string, CompetitorSummary[]> = {}

  for (const model of models) {
    const modelResults = results.filter(r => r.model === model)
    const prevModelResults = prevByModel[model] ?? []
    const keywordIds = [...new Set(modelResults.map(r => r.keyword_id))]

    summaries[model] = competitors.map(comp => {
      let mentionedKeywords = 0
      const positions: number[] = []
      const urls: string[] = []

      for (const kwId of keywordIds) {
        const kwResults = modelResults.filter(r => r.keyword_id === kwId)
        const kwMentioned = kwResults.some(r => {
          const data = r.competitors_data as Record<string, CompetitorMention> | null
          return data?.[comp.name]?.mentioned
        })
        if (kwMentioned) mentionedKeywords++

        for (const r of kwResults) {
          const data = r.competitors_data as Record<string, CompetitorMention> | null
          const entry = data?.[comp.name]
          if (entry?.position != null) positions.push(entry.position)
          if (entry?.urls) urls.push(...entry.urls)
        }
      }

      const mentionRate = keywordIds.length > 0
        ? Math.round((mentionedKeywords / keywordIds.length) * 100)
        : 0
      const avgPosition = positions.length > 0
        ? Math.round((positions.reduce((a, b) => a + b, 0) / positions.length) * 10) / 10
        : null

      // Previous run comparison
      const prevPositions: number[] = []
      for (const r of prevModelResults) {
        const data = r.competitors_data as Record<string, CompetitorMention> | null
        const entry = data?.[comp.name]
        if (entry?.position != null) prevPositions.push(entry.position)
      }
      const prevAvg = prevPositions.length > 0
        ? prevPositions.reduce((a, b) => a + b, 0) / prevPositions.length
        : null
      const positionChange = avgPosition != null && prevAvg != null
        ? Math.round((prevAvg - avgPosition) * 10) / 10
        : null

      return {
        name: comp.name,
        mention_rate: mentionRate,
        avg_position: avgPosition,
        position_change: positionChange,
        top_urls: [...new Set(urls)].slice(0, 5),
      }
    })
  }

  return summaries
}

function groupByModel(results: AIVisibilityResult[]): Record<string, AIVisibilityResult[]> {
  const grouped: Record<string, AIVisibilityResult[]> = {}
  for (const r of results) {
    if (!grouped[r.model]) grouped[r.model] = []
    grouped[r.model].push(r)
  }
  return grouped
}

// ---------------------------------------------------------------------------
// History row type (for expandable rows)
// ---------------------------------------------------------------------------

export interface PositionHistoryRow {
  run_date: string
  avg_position: number | null
  change: number | null
}

// ---------------------------------------------------------------------------
// Main hook
// ---------------------------------------------------------------------------

export function useAIVisibility(selectedRunId?: string) {
  const supabase = createClient()

  const [runs, setRuns] = useState<AIVisibilityRun[]>([])
  const [latestRun, setLatestRun] = useState<AIVisibilityRun | null>(null)
  const [results, setResults] = useState<AIVisibilityResult[]>([])
  const [keywords, setKeywords] = useState<AIVisibilityKeyword[]>([])
  const [competitors, setCompetitors] = useState<AIVisibilityCompetitor[]>([])
  const [synupSummaries, setSynupSummaries] = useState<Record<string, SynupKeywordSummary[]>>({})
  const [competitorSummaries, setCompetitorSummaries] = useState<Record<string, CompetitorSummary[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [frequency, setFrequency] = useState('2x-week')

  // ── Fetch config ────────────────────────────────────

  const fetchFrequency = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('ai_visibility_config')
      .select('value')
      .eq('key', 'schedule_frequency')
      .maybeSingle()
    if (err) throw new Error(`Failed to load config: ${err.message}`)
    if (data?.value) setFrequency(data.value)
  }, [])

  const updateFrequency = useCallback(async (freq: string) => {
    setFrequency(freq)
    const { error: err } = await supabase
      .from('ai_visibility_config')
      .upsert({ key: 'schedule_frequency', value: freq, updated_at: new Date().toISOString() })
    if (err) {
      setError(`Failed to save frequency: ${err.message}`)
    }
  }, [])

  // ── Fetch runs ──────────────────────────────────────

  const fetchRuns = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('ai_visibility_runs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(50)
    if (err) throw new Error(`Failed to load runs: ${err.message}`)
    setRuns(data ?? [])
    if (data?.length) setLatestRun(data[0])
  }, [])

  // ── Fetch keywords ─────────────────────────────────

  const fetchKeywords = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('ai_visibility_keywords')
      .select('*')
      .order('category')
      .order('keyword')
    if (err) throw new Error(`Failed to load keywords: ${err.message}`)
    setKeywords(data ?? [])
  }, [])

  // ── Fetch competitors ──────────────────────────────

  const fetchCompetitors = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('ai_visibility_competitors')
      .select('*')
      .order('name')
    if (err) throw new Error(`Failed to load competitors: ${err.message}`)
    setCompetitors(data ?? [])
  }, [])

  // ── Fetch results + compute summaries ──────────────

  const fetchResults = useCallback(async (runId: string) => {
    const { data: currentResults, error: err } = await supabase
      .from('ai_visibility_results')
      .select('*')
      .eq('run_id', runId)
    if (err) throw new Error(`Failed to load results: ${err.message}`)
    setResults(currentResults ?? [])

    // Find previous run for delta comparison
    const { data: prevRuns } = await supabase
      .from('ai_visibility_runs')
      .select('id')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(2)

    let previousResults: AIVisibilityResult[] = []
    const prevRun = prevRuns?.find(r => r.id !== runId)
    if (prevRun) {
      const { data } = await supabase
        .from('ai_visibility_results')
        .select('*')
        .eq('run_id', prevRun.id)
      previousResults = data ?? []
    }

    return { currentResults: currentResults ?? [], previousResults }
  }, [])

  // ── Fetch position history for a keyword+model ────

  const fetchPositionHistory = useCallback(async (
    keywordId: string,
    model: string
  ): Promise<PositionHistoryRow[]> => {
    // Get last 10 completed runs
    const { data: completedRuns } = await supabase
      .from('ai_visibility_runs')
      .select('id, completed_at')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(10)

    if (!completedRuns?.length) return []

    const runIds = completedRuns.map(r => r.id)
    const { data: histResults } = await supabase
      .from('ai_visibility_results')
      .select('run_id, synup_position')
      .eq('keyword_id', keywordId)
      .eq('model', model)
      .in('run_id', runIds)

    if (!histResults?.length) return []

    // Group by run, compute avg position per run
    const byRun: Record<string, number[]> = {}
    for (const r of histResults) {
      if (r.synup_position != null) {
        if (!byRun[r.run_id]) byRun[r.run_id] = []
        byRun[r.run_id].push(r.synup_position)
      }
    }

    const rows: PositionHistoryRow[] = []
    for (let i = 0; i < completedRuns.length; i++) {
      const run = completedRuns[i]
      const positions = byRun[run.id]
      const avg = positions?.length
        ? Math.round((positions.reduce((a, b) => a + b, 0) / positions.length) * 10) / 10
        : null

      // Change vs next older run
      let change: number | null = null
      if (i < completedRuns.length - 1) {
        const prevRun = completedRuns[i + 1]
        const prevPositions = byRun[prevRun.id]
        const prevAvg = prevPositions?.length
          ? prevPositions.reduce((a, b) => a + b, 0) / prevPositions.length
          : null
        if (avg != null && prevAvg != null) {
          change = Math.round((prevAvg - avg) * 10) / 10
        }
      }

      rows.push({
        run_date: run.completed_at ?? '',
        avg_position: avg,
        change,
      })
    }

    return rows
  }, [])

  // ── Initial load ───────────────────────────────────

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([fetchRuns(), fetchKeywords(), fetchCompetitors(), fetchFrequency()])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data')
    }
    setLoading(false)
  }, [fetchRuns, fetchKeywords, fetchCompetitors, fetchFrequency])

  useEffect(() => { loadAll() }, [loadAll])

  // ── Load results when run changes ──────────────────

  useEffect(() => {
    const runId = selectedRunId ?? latestRun?.id
    if (!runId || keywords.length === 0) return

    fetchResults(runId).then(({ currentResults, previousResults }) => {
      const activeKeywords = keywords.filter(k => k.is_active)
      setSynupSummaries(computeSynupSummaries(currentResults, activeKeywords, previousResults))
      setCompetitorSummaries(computeCompetitorSummaries(currentResults, competitors, previousResults))
    }).catch(e => {
      setError(e instanceof Error ? e.message : 'Failed to load results')
    })
  }, [selectedRunId, latestRun?.id, keywords, competitors, fetchResults])

  // ── Keyword CRUD ───────────────────────────────────

  const addKeyword = useCallback(async (keyword: string, category: string) => {
    const { error } = await supabase
      .from('ai_visibility_keywords')
      .insert({ keyword, category })
    if (!error) await fetchKeywords()
    return error
  }, [fetchKeywords])

  const updateKeyword = useCallback(async (id: string, updates: Partial<AIVisibilityKeyword>) => {
    const { error } = await supabase
      .from('ai_visibility_keywords')
      .update(updates)
      .eq('id', id)
    if (!error) await fetchKeywords()
    return error
  }, [fetchKeywords])

  const deactivateKeyword = useCallback(async (id: string) => {
    return updateKeyword(id, { is_active: false })
  }, [updateKeyword])

  // ── Competitor CRUD ────────────────────────────────

  const addCompetitor = useCallback(async (name: string, variations: string[]) => {
    const { error } = await supabase
      .from('ai_visibility_competitors')
      .insert({ name, variations })
    if (!error) await fetchCompetitors()
    return error
  }, [fetchCompetitors])

  const updateCompetitor = useCallback(async (id: string, updates: Partial<AIVisibilityCompetitor>) => {
    const { error } = await supabase
      .from('ai_visibility_competitors')
      .update(updates)
      .eq('id', id)
    if (!error) await fetchCompetitors()
    return error
  }, [fetchCompetitors])

  const deactivateCompetitor = useCallback(async (id: string) => {
    return updateCompetitor(id, { is_active: false })
  }, [updateCompetitor])

  // ── Trigger run ────────────────────────────────────

  const triggerRun = useCallback(async () => {
    const res = await fetch('/api/ai-visibility/run', { method: 'POST' })
    const json = await res.json()
    if (json.error) return { error: json.error }
    await fetchRuns()
    return { run: json.run }
  }, [fetchRuns])

  return {
    // Data
    runs,
    latestRun,
    results,
    keywords,
    competitors,
    synupSummaries,
    competitorSummaries,
    loading,
    error,
    frequency,
    // Actions
    addKeyword,
    updateKeyword,
    deactivateKeyword,
    addCompetitor,
    updateCompetitor,
    deactivateCompetitor,
    triggerRun,
    updateFrequency,
    fetchPositionHistory,
    refetch: loadAll,
  }
}

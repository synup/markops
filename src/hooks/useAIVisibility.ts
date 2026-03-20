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
      const mentioned = mentionedCount > kwResults.length / 2
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

  // ── Fetch runs ──────────────────────────────────────

  const fetchRuns = useCallback(async () => {
    const { data } = await supabase
      .from('ai_visibility_runs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(50)
    setRuns(data ?? [])
    if (data?.length) setLatestRun(data[0])
  }, [])

  // ── Fetch keywords ─────────────────────────────────

  const fetchKeywords = useCallback(async () => {
    const { data } = await supabase
      .from('ai_visibility_keywords')
      .select('*')
      .order('category')
      .order('keyword')
    setKeywords(data ?? [])
  }, [])

  // ── Fetch competitors ──────────────────────────────

  const fetchCompetitors = useCallback(async () => {
    const { data } = await supabase
      .from('ai_visibility_competitors')
      .select('*')
      .order('name')
    setCompetitors(data ?? [])
  }, [])

  // ── Fetch results + compute summaries ──────────────

  const fetchResults = useCallback(async (runId: string) => {
    const { data: currentResults } = await supabase
      .from('ai_visibility_results')
      .select('*')
      .eq('run_id', runId)
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

  // ── Initial load ───────────────────────────────────

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([fetchRuns(), fetchKeywords(), fetchCompetitors()])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data')
    }
    setLoading(false)
  }, [fetchRuns, fetchKeywords, fetchCompetitors])

  useEffect(() => { loadAll() }, [loadAll])

  // ── Load results when run changes ──────────────────

  useEffect(() => {
    const runId = selectedRunId ?? latestRun?.id
    if (!runId || keywords.length === 0) return

    fetchResults(runId).then(({ currentResults, previousResults }) => {
      const activeKeywords = keywords.filter(k => k.is_active)
      setSynupSummaries(computeSynupSummaries(currentResults, activeKeywords, previousResults))
      setCompetitorSummaries(computeCompetitorSummaries(currentResults, competitors, previousResults))
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
    // Actions
    addKeyword,
    updateKeyword,
    deactivateKeyword,
    addCompetitor,
    updateCompetitor,
    deactivateCompetitor,
    triggerRun,
    refetch: loadAll,
  }
}

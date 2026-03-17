'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import type {
  PseoArticle,
  PseoAnalytics,
  PseoDateRange,
  PseoCustomRange,
  PseoSortConfig,
  PseoSortField,
  PseoColumnFilters,
} from '@/types'

function getDaysForRange(range: PseoDateRange): number | null {
  switch (range) {
    case '7d': return 7
    case '14d': return 14
    case '1m': return 30
    case 'all': return null
    case 'custom': return null // handled separately
  }
}

function isWithinCustomRange(dateStr: string, customRange: PseoCustomRange): boolean {
  const d = parseDate(dateStr)
  if (!d) return false
  const start = new Date(customRange.start)
  start.setHours(0, 0, 0, 0)
  const end = new Date(customRange.end)
  end.setHours(23, 59, 59, 999)
  return d >= start && d <= end
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? null : d
}

function isWithinDays(dateStr: string, days: number): boolean {
  const d = parseDate(dateStr)
  if (!d) return false
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  cutoff.setHours(0, 0, 0, 0)
  return d >= cutoff
}

function computeAnalytics(articles: PseoArticle[]): PseoAnalytics {
  const total = articles.length
  if (total === 0) {
    return { totalArticles: 0, articlesLast7Days: 0, indexingSuccessRate: 0 }
  }

  const last7 = articles.filter(a => isWithinDays(a.publishedDate, 7)).length

  const indexed = articles.filter(a =>
    a.indexerResponseCode === 200 || a.indexerStatus?.toLowerCase() === 'success'
  ).length
  const rate = (indexed / total) * 100

  return { totalArticles: total, articlesLast7Days: last7, indexingSuccessRate: rate }
}

export function usePseoContent() {
  const [allArticles, setAllArticles] = useState<PseoArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<PseoDateRange>('7d')
  const [customRange, setCustomRange] = useState<PseoCustomRange>({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  })
  const [columnFilters, setColumnFilters] = useState<PseoColumnFilters>({})
  const [sort, setSort] = useState<PseoSortConfig>({ field: 'publishedDate', direction: 'desc' })
  const [page, setPage] = useState(1)
  const [expandedColumns, setExpandedColumns] = useState(false)
  const pageSize = 20

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/pseo-content')
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          throw new Error(json.error || 'Failed to fetch')
        }
        const json = await res.json()
        setAllArticles(json.articles || [])
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Date-filtered articles
  const dateFiltered = useMemo(() => {
    if (dateRange === 'custom') {
      return allArticles.filter(a => isWithinCustomRange(a.publishedDate, customRange))
    }
    const days = getDaysForRange(dateRange)
    if (days === null) return allArticles
    return allArticles.filter(a => isWithinDays(a.publishedDate, days))
  }, [allArticles, dateRange, customRange])

  // Per-site article counts (from date-filtered data)
  const perSiteCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    dateFiltered.forEach(a => {
      if (a.site) counts[a.site] = (counts[a.site] || 0) + 1
    })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [dateFiltered])

  // Column-filtered articles
  const filtered = useMemo(() => {
    return dateFiltered.filter(article => {
      for (const [key, val] of Object.entries(columnFilters)) {
        if (!val) continue
        const field = key as keyof PseoArticle
        const cellValue = String(article[field] ?? '')
        if (!cellValue.toLowerCase().includes(val.toLowerCase())) return false
      }
      return true
    })
  }, [dateFiltered, columnFilters])

  // Sorted
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aVal = a[sort.field]
      const bVal = b[sort.field]
      const mod = sort.direction === 'asc' ? 1 : -1
      if (typeof aVal === 'number' && typeof bVal === 'number') return (aVal - bVal) * mod
      return String(aVal).localeCompare(String(bVal)) * mod
    })
  }, [filtered, sort])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return sorted.slice(start, start + pageSize)
  }, [sorted, safePage])

  // Analytics from date-filtered data
  const analytics = useMemo(() => computeAnalytics(dateFiltered), [dateFiltered])

  // Filter options (derived from date-filtered data for categorical columns)
  const filterOptions = useMemo(() => ({
    site: [...new Set(dateFiltered.map(a => a.site).filter(Boolean))].sort(),
    contentType: [...new Set(dateFiltered.map(a => a.contentType).filter(Boolean))].sort(),
    indexerStatus: [...new Set(dateFiltered.map(a => a.indexerStatus).filter(Boolean))].sort(),
    category: [...new Set(dateFiltered.map(a => a.category).filter(Boolean))].sort(),
  }), [dateFiltered])

  // Reset page when filters or date range change
  useEffect(() => { setPage(1) }, [dateRange, customRange, columnFilters])

  const toggleSort = useCallback((field: PseoSortField) => {
    setSort(prev =>
      prev.field === field
        ? { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { field, direction: 'asc' }
    )
  }, [])

  const updateColumnFilter = useCallback((field: keyof PseoArticle, value: string) => {
    setColumnFilters(prev => ({ ...prev, [field]: value || undefined }))
  }, [])

  const clearAllFilters = useCallback(() => {
    setColumnFilters({})
  }, [])

  const hasActiveFilters = Object.values(columnFilters).some(v => v)

  return {
    articles: paginated,
    totalFiltered: sorted.length,
    analytics,
    perSiteCounts,
    loading,
    error,
    dateRange,
    setDateRange,
    customRange,
    setCustomRange,
    columnFilters,
    updateColumnFilter,
    clearAllFilters,
    hasActiveFilters,
    filterOptions,
    sort,
    toggleSort,
    page: safePage,
    setPage,
    totalPages,
    expandedColumns,
    setExpandedColumns,
  }
}

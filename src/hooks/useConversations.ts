'use client'

import { useCallback, useEffect, useState } from 'react'
import type {
  ConversationRow, Counts, ConversationsResponse, ReviewStatus,
} from '@/types/conversation'
import type { UrlState } from './useUrlState'

const ZERO_COUNTS: Counts = { pending: 0, approved: 0, rejected: 0 }

function buildQuery(s: UrlState): string {
  const p = new URLSearchParams()
  p.set('tab', s.tab)
  if (s.conversationType) p.set('conversation_type', s.conversationType)
  if (s.bracket)          p.set('bracket', s.bracket)
  if (s.sort)             p.set('sort', s.sort)
  return p.toString()
}

type State = {
  rows: ConversationRow[]
  counts: Counts
  loading: boolean
  error: string | null
}

const INITIAL: State = { rows: [], counts: ZERO_COUNTS, loading: true, error: null }

export function useConversations(urlState: UrlState) {
  const [state, setState] = useState<State>(INITIAL)

  const refetch = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }))
    try {
      const res = await fetch(`/api/conversations?${buildQuery(urlState)}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as ConversationsResponse
      setState({ rows: data.rows, counts: data.counts, loading: false, error: null })
    } catch (err) {
      setState(s => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : 'fetch failed',
      }))
    }
  }, [urlState.tab, urlState.conversationType, urlState.bracket, urlState.sort])

  useEffect(() => {
    refetch()
  }, [refetch])

  const removeRow = useCallback((id: string) => {
    setState(s => ({ ...s, rows: s.rows.filter(r => r.id !== id) }))
  }, [])

  const replaceRow = useCallback((row: ConversationRow) => {
    setState(s => {
      const idx = s.rows.findIndex(r => r.id === row.id)
      if (idx === -1) return s
      const next = [...s.rows]
      next[idx] = row
      return { ...s, rows: next }
    })
  }, [])

  const insertRow = useCallback((row: ConversationRow) => {
    setState(s => {
      if (s.rows.some(r => r.id === row.id)) return s
      return { ...s, rows: [row, ...s.rows] }
    })
  }, [])

  const bumpCount = useCallback((status: ReviewStatus, delta: number) => {
    setState(s => ({
      ...s,
      counts: { ...s.counts, [status]: Math.max(0, s.counts[status] + delta) },
    }))
  }, [])

  return {
    rows: state.rows,
    counts: state.counts,
    loading: state.loading,
    error: state.error,
    refetch,
    removeRow,
    replaceRow,
    insertRow,
    bumpCount,
  }
}

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type DraftStatusResponse = {
  id: string
  author_voice: 'sudy' | 'roshan' | 'niladri'
  status: 'pending' | 'generating' | 'ready' | 'failed'
  chars: number | null
  ready_at: string | null
  error_message: string | null
  has_content: boolean
}

const POLL_INTERVAL_MS = 5000
const ACTIVE_STATUSES: ReadonlyArray<DraftStatusResponse['status']> = ['pending', 'generating']

type Options = { enabled?: boolean; pollOnPending?: boolean }

type Result = {
  draft: DraftStatusResponse | null
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

export function useConversationDraft(
  callInsightId: string | null,
  options: Options = {},
): Result {
  const enabled = options.enabled !== false
  const pollOnPending = options.pollOnPending !== false
  const [draft, setDraft] = useState<DraftStatusResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [refetchCount, setRefetchCount] = useState(0)
  const refetch = useCallback(() => setRefetchCount(n => n + 1), [])

  // Latest options snapshot for the polling loop (avoids re-running the effect
  // when pollOnPending toggles mid-poll).
  const pollOnPendingRef = useRef(pollOnPending)
  pollOnPendingRef.current = pollOnPending

  useEffect(() => {
    if (!enabled || !callInsightId) {
      setDraft(null)
      setIsLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | null = null
    const ctrl = new AbortController()

    const runFetch = async (isInitial: boolean) => {
      if (isInitial) setIsLoading(true)
      try {
        const resp = await fetch(
          `/api/conversations/${encodeURIComponent(callInsightId)}/draft`,
          { signal: ctrl.signal, cache: 'no-store' },
        )
        if (!resp.ok) throw new Error(`draft fetch failed: HTTP ${resp.status}`)
        const data = (await resp.json()) as { draft: DraftStatusResponse | null }
        if (cancelled) return
        setDraft(data.draft)
        setError(null)
        setIsLoading(false)
        if (
          pollOnPendingRef.current &&
          data.draft &&
          ACTIVE_STATUSES.includes(data.draft.status)
        ) {
          timer = setTimeout(() => { void runFetch(false) }, POLL_INTERVAL_MS)
        }
      } catch (e) {
        if (cancelled) return
        if (e instanceof DOMException && e.name === 'AbortError') return
        setError(e instanceof Error ? e : new Error(String(e)))
        setIsLoading(false)
      }
    }

    void runFetch(true)

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
      ctrl.abort()
    }
  }, [callInsightId, enabled, refetchCount])

  return { draft, isLoading, error, refetch }
}

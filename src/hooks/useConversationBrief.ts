'use client'

import { useEffect, useState } from 'react'

export type BriefStatusResponse = {
  id: string
  asset_type: 'blog_post' | 'deep_article' | 'use_case' | 'collateral' | 'tool'
  status: 'pending' | 'generating' | 'ready' | 'failed'
  chars: number | null
  ready_at: string | null
  output_tokens: number | null
  has_content: boolean
  error_message: string | null
}

const POLL_INTERVAL_MS = 5000
const ACTIVE_STATUSES: ReadonlyArray<BriefStatusResponse['status']> = ['pending', 'generating']

type Options = { enabled?: boolean }

type Result = {
  brief: BriefStatusResponse | null
  isLoading: boolean
  error: Error | null
}

export function useConversationBrief(
  callInsightId: string | null,
  options: Options = {},
): Result {
  const enabled = options.enabled !== false
  const [brief, setBrief] = useState<BriefStatusResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!enabled || !callInsightId) {
      setBrief(null)
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
          `/api/conversations/${encodeURIComponent(callInsightId)}/brief`,
          { signal: ctrl.signal, cache: 'no-store' },
        )
        if (!resp.ok) throw new Error(`brief fetch failed: HTTP ${resp.status}`)
        const data = (await resp.json()) as { brief: BriefStatusResponse | null }
        if (cancelled) return
        setBrief(data.brief)
        setError(null)
        setIsLoading(false)
        if (data.brief && ACTIVE_STATUSES.includes(data.brief.status)) {
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
  }, [callInsightId, enabled])

  return { brief, isLoading, error }
}

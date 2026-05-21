'use client'

import { useCallback, useEffect, useState } from 'react'

export type DraftWithContent = {
  id: string
  author_voice: string
  draft_content: string
}

type State = {
  draft: DraftWithContent | null
  pending: string
  savedContent: string
  isLoading: boolean
  isSaving: boolean
  error: string | null
  savedAt: number | null
}

const INITIAL: State = {
  draft: null, pending: '', savedContent: '',
  isLoading: false, isSaving: false, error: null, savedAt: null,
}

export function useDraftEditor(callInsightId: string, isOpen: boolean) {
  const [s, setS] = useState<State>(INITIAL)

  useEffect(() => {
    if (!isOpen) { setS(INITIAL); return }
    let cancelled = false
    const ctrl = new AbortController()
    setS(prev => ({ ...prev, isLoading: true, error: null }))
    fetch(
      `/api/conversations/${encodeURIComponent(callInsightId)}/draft?content=true`,
      { signal: ctrl.signal, cache: 'no-store' },
    )
      .then(async r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return (await r.json()) as { draft: DraftWithContent | null }
      })
      .then(data => {
        if (cancelled) return
        if (data.draft) {
          setS(prev => ({
            ...prev,
            draft: data.draft,
            pending: data.draft!.draft_content,
            savedContent: data.draft!.draft_content,
            isLoading: false,
          }))
        } else {
          setS(prev => ({ ...prev, isLoading: false }))
        }
      })
      .catch(e => {
        if (cancelled) return
        if (e instanceof DOMException && e.name === 'AbortError') return
        setS(prev => ({
          ...prev,
          error: e instanceof Error ? e.message : String(e),
          isLoading: false,
        }))
      })
    return () => { cancelled = true; ctrl.abort() }
  }, [isOpen, callInsightId])

  const setPending = useCallback((content: string) => {
    setS(prev => ({ ...prev, pending: content }))
  }, [])

  const discard = useCallback(() => {
    setS(prev => ({ ...prev, pending: prev.savedContent }))
  }, [])

  const save = useCallback(async () => {
    setS(prev => ({ ...prev, isSaving: true, error: null }))
    try {
      const r = await fetch(
        `/api/conversations/${encodeURIComponent(callInsightId)}/draft`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ draft_content: s.pending }),
        },
      )
      if (!r.ok) {
        const detail = await r.text()
        throw new Error(`HTTP ${r.status}: ${detail.slice(0, 200)}`)
      }
      const data = (await r.json()) as { draft: DraftWithContent }
      setS(prev => ({
        ...prev,
        draft: data.draft,
        savedContent: data.draft.draft_content,
        savedAt: Date.now(),
        isSaving: false,
      }))
    } catch (e) {
      setS(prev => ({
        ...prev,
        error: e instanceof Error ? e.message : String(e),
        isSaving: false,
      }))
    }
  }, [callInsightId, s.pending])

  return { ...s, setPending, discard, save, hasChanges: s.pending !== s.savedContent }
}

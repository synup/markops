'use client'

import { useCallback, useEffect, useState } from 'react'

export type BriefPromptRow = {
  id: string
  prompt_name: string
  prompt_content: string
  chars: number
  updated_by: string | null
  updated_at: string
}

type Result = {
  prompts: BriefPromptRow[]
  selectedPromptName: string | null
  selectPrompt: (name: string) => void
  pendingChanges: Record<string, string>
  setPendingContent: (name: string, content: string) => void
  saveSelected: () => Promise<void>
  discardSelected: () => void
  isLoading: boolean
  isSaving: boolean
  lastSavedAt: number | null
  error: string | null
}

export function useBriefPrompts(): Result {
  const [prompts, setPrompts] = useState<BriefPromptRow[]>([])
  const [selectedPromptName, setSelectedPromptName] = useState<string | null>(null)
  const [pendingChanges, setPendingChanges] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const ctrl = new AbortController()
    ;(async () => {
      try {
        const resp = await fetch('/api/brief-prompts', { signal: ctrl.signal, cache: 'no-store' })
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
        const data = (await resp.json()) as { prompts: BriefPromptRow[] }
        if (cancelled) return
        setPrompts(data.prompts)
        setSelectedPromptName(data.prompts[0]?.prompt_name ?? null)
      } catch (e) {
        if (cancelled) return
        if (e instanceof DOMException && e.name === 'AbortError') return
        setError(e instanceof Error ? e.message : String(e))
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => {
      cancelled = true
      ctrl.abort()
    }
  }, [])

  const selectPrompt = useCallback((name: string) => {
    setSelectedPromptName(name)
  }, [])

  const setPendingContent = useCallback((name: string, content: string) => {
    setPrompts(currentPrompts => {
      // Use the latest prompts via functional update for accurate saved-vs-pending compare.
      const saved = currentPrompts.find(p => p.prompt_name === name)?.prompt_content
      setPendingChanges(prev => {
        if (saved === content) {
          if (!(name in prev)) return prev
          const { [name]: _drop, ...rest } = prev
          return rest
        }
        return { ...prev, [name]: content }
      })
      return currentPrompts
    })
  }, [])

  const saveSelected = useCallback(async () => {
    if (!selectedPromptName) return
    const content = pendingChanges[selectedPromptName]
    if (content === undefined) return
    setIsSaving(true)
    setError(null)
    try {
      const resp = await fetch(
        `/api/brief-prompts/${encodeURIComponent(selectedPromptName)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt_content: content }),
        },
      )
      if (!resp.ok) {
        const detail = await resp.text()
        throw new Error(`HTTP ${resp.status}: ${detail.slice(0, 200)}`)
      }
      const data = (await resp.json()) as { prompt: BriefPromptRow }
      setPrompts(prev => prev.map(p =>
        p.prompt_name === data.prompt.prompt_name ? data.prompt : p,
      ))
      setPendingChanges(prev => {
        const { [selectedPromptName]: _drop, ...rest } = prev
        return rest
      })
      setLastSavedAt(Date.now())
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setIsSaving(false)
    }
  }, [selectedPromptName, pendingChanges])

  const discardSelected = useCallback(() => {
    if (!selectedPromptName) return
    setPendingChanges(prev => {
      if (!(selectedPromptName in prev)) return prev
      const { [selectedPromptName]: _drop, ...rest } = prev
      return rest
    })
  }, [selectedPromptName])

  return {
    prompts,
    selectedPromptName,
    selectPrompt,
    pendingChanges,
    setPendingContent,
    saveSelected,
    discardSelected,
    isLoading,
    isSaving,
    lastSavedAt,
    error,
  }
}

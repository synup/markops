'use client'

import { useState, useMemo, useCallback } from 'react'
import type { ToolIdea, ContentIdea } from './useRedditResearch'

export type DrawerTarget =
  | { kind: 'tool'; idea: ToolIdea }
  | { kind: 'content'; idea: ContentIdea }

type InternalState = { kind: 'tool' | 'content'; id: string } | null

export function useResearchDrawer(
  toolIdeas: ToolIdea[],
  contentIdeas: ContentIdea[],
): {
  openItem: DrawerTarget | null
  openTool: (id: string) => void
  openContent: (id: string) => void
  close: () => void
} {
  const [selected, setSelected] = useState<InternalState>(null)

  const openItem: DrawerTarget | null = useMemo(() => {
    if (!selected) return null
    if (selected.kind === 'tool') {
      const idea = toolIdeas.find(i => i.id === selected.id)
      return idea ? { kind: 'tool', idea } : null
    }
    const idea = contentIdeas.find(i => i.id === selected.id)
    return idea ? { kind: 'content', idea } : null
  }, [selected, toolIdeas, contentIdeas])

  const openTool = useCallback((id: string) => setSelected({ kind: 'tool', id }), [])
  const openContent = useCallback((id: string) => setSelected({ kind: 'content', id }), [])
  const close = useCallback(() => setSelected(null), [])

  return { openItem, openTool, openContent, close }
}

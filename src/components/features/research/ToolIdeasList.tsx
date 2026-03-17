'use client'

import { useState } from 'react'
import { useToolIdeas } from '@/hooks/useRedditResearch'
import { ToolIdeaRow } from './ToolIdeaRow'
import { ReclassifyToast } from './ReclassifyToast'
import { ExportCsvButton } from './ExportCsvButton'

type Filter = 'all' | 'pending' | 'approved' | 'rejected'

export function ToolIdeasList() {
  const { ideas, loading, actOnTool, reclassifyToContent, undoData, undoReclassify, clearUndo } = useToolIdeas()
  const [filter, setFilter] = useState<Filter>('all')

  if (loading) {
    return <div className="py-8 text-center text-sm" style={{ color: 'var(--text-dim)' }}>Loading tool ideas...</div>
  }

  if (!ideas.length && !undoData) {
    return <div className="py-8 text-center text-sm" style={{ color: 'var(--text-dim)' }}>No tool ideas scored yet.</div>
  }

  const filtered = ideas.filter(idea => {
    if (filter === 'all') return true
    if (filter === 'pending') return !idea.latest_action
    return idea.latest_action?.action === filter
  })

  const counts = {
    all: ideas.length,
    pending: ideas.filter(i => !i.latest_action).length,
    approved: ideas.filter(i => i.latest_action?.action === 'approved').length,
    rejected: ideas.filter(i => i.latest_action?.action === 'rejected').length,
  }

  return (
    <div>
      {undoData && (
        <ReclassifyToast trackName="Content Ideas" onUndo={undoReclassify} onDismiss={clearUndo} />
      )}
      <div className="mb-3 flex items-center justify-between">
        <FilterBar filter={filter} onFilter={setFilter} counts={counts} />
        <ExportCsvButton type="tool" ideas={ideas} />
      </div>
      <div className="flex flex-col gap-2">
        {filtered.map(idea => (
          <ToolIdeaRow
            key={idea.id}
            idea={idea}
            onApprove={(postId) => actOnTool(postId, 'approved')}
            onReject={(postId) => actOnTool(postId, 'rejected')}
            onReclassify={(postId, scoreId) => reclassifyToContent(postId, scoreId)}
          />
        ))}
      </div>
    </div>
  )
}

function FilterBar({ filter, onFilter, counts }: {
  filter: Filter
  onFilter: (f: Filter) => void
  counts: Record<Filter, number>
}) {
  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ]

  return (
    <div className="flex gap-1">
      {filters.map(f => (
        <button
          key={f.key}
          onClick={() => onFilter(f.key)}
          className="rounded px-2.5 py-1 text-xs font-medium transition-colors"
          style={{
            background: filter === f.key ? 'var(--brand-muted)' : 'var(--surface-2)',
            color: filter === f.key ? 'var(--brand)' : 'var(--text-muted)',
            border: `1px solid ${filter === f.key ? 'var(--brand-border)' : 'var(--border)'}`,
          }}
        >
          {f.label} ({counts[f.key]})
        </button>
      ))}
    </div>
  )
}

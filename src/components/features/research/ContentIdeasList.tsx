'use client'

import { useState } from 'react'
import { useContentIdeas } from '@/hooks/useRedditResearch'
import { ContentIdeaRow } from './ContentIdeaRow'
import { ReclassifyToast } from './ReclassifyToast'
import { ExportCsvButton } from './ExportCsvButton'
import { GenerateButton } from './GenerateButton'

type Filter = 'all' | 'pending' | 'approved' | 'rejected'

export function ContentIdeasList() {
  const { ideas, loading, actOnContent, reclassifyToTool, undoData, undoReclassify, clearUndo } = useContentIdeas()
  const [filter, setFilter] = useState<Filter>('all')

  if (loading) {
    return <div className="py-8 text-center text-sm" style={{ color: 'var(--text-dim)' }}>Loading content ideas...</div>
  }

  if (!ideas.length && !undoData) {
    return <div className="py-8 text-center text-sm" style={{ color: 'var(--text-dim)' }}>No content ideas scored yet.</div>
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
        <ReclassifyToast trackName="Tool Ideas" onUndo={undoReclassify} onDismiss={clearUndo} />
      )}
      <div className="mb-3 flex items-center justify-between">
        <FilterBar filter={filter} onFilter={setFilter} counts={counts} />
        <div className="flex items-center gap-2">
          <GenerateButton type="content_brief" />
          <ExportCsvButton type="content" ideas={ideas} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {filtered.map(idea => (
          <ContentIdeaRow
            key={idea.id}
            idea={idea}
            onApprove={(postId) => actOnContent(postId, 'approved')}
            onReject={(postId) => actOnContent(postId, 'rejected')}
            onReclassify={(postId, scoreId) => reclassifyToTool(postId, scoreId)}
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
          className="btn-research rounded px-2.5 py-1 text-xs font-medium"
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

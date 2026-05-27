'use client'

import { useState } from 'react'
import { useToolIdeas } from '@/hooks/useRedditResearch'
import { ToolIdeaRow } from './ToolIdeaRow'
import { ReclassifyToast } from './ReclassifyToast'
import { ExportCsvButton } from './ExportCsvButton'
import { GenerateButton } from './GenerateButton'

type Filter = 'all' | 'pending' | 'approved' | 'rejected'

export function ToolIdeasList() {
  const { ideas, loading, actOnTool, reclassifyToContent, undoData, undoReclassify, clearUndo } = useToolIdeas()
  const [filter, setFilter] = useState<Filter>('all')

  if (loading) {
    return <div className="py-12 text-center text-[13px] text-slate-500">Loading tool ideas...</div>
  }

  if (!ideas.length && !undoData) {
    return <div className="py-12 text-center text-[13px] text-slate-500">No tool ideas scored yet.</div>
  }

  const excludedFromApproved = new Set(['rejected', 'archived'])
  const isApproved = (a?: string | null) => !!a && !excludedFromApproved.has(a)

  const filtered = ideas.filter(idea => {
    if (filter === 'all') return true
    if (filter === 'pending') return !idea.latest_action
    if (filter === 'approved') return isApproved(idea.latest_action?.action)
    return idea.latest_action?.action === filter
  })

  const counts = {
    all: ideas.length,
    pending: ideas.filter(i => !i.latest_action).length,
    approved: ideas.filter(i => isApproved(i.latest_action?.action)).length,
    rejected: ideas.filter(i => i.latest_action?.action === 'rejected').length,
  }

  return (
    <div>
      {undoData && (
        <ReclassifyToast trackName="Content Ideas" onUndo={undoReclassify} onDismiss={clearUndo} />
      )}
      <div className="mb-3 flex items-center justify-between">
        <FilterBar filter={filter} onFilter={setFilter} counts={counts} />
        <div className="flex items-center gap-2">
          <GenerateButton type="tool_spec" />
          <ExportCsvButton type="tool" ideas={ideas} />
        </div>
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
    <div className="flex gap-1.5">
      {filters.map(f => (
        <button
          key={f.key}
          onClick={() => onFilter(f.key)}
          className={`rounded-md px-3 py-1 text-[12px] font-medium transition-colors duration-150 ${
            filter === f.key
              ? 'bg-cyan-500 text-white'
              : 'border-[0.5px] border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          {f.label} ({counts[f.key]})
        </button>
      ))}
    </div>
  )
}

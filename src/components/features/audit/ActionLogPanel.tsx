'use client'

import { useState } from 'react'
import { ActionLogRow } from './ActionLogRow'
import { useActionLog, type ActionLogEntry } from '@/hooks/useKeywordActions'

export function ActionLogPanel() {
  const { entries, loading, refetch } = useActionLog(100)
  const [filterType, setFilterType] = useState<string>('all')

  const filtered = filterType === 'all'
    ? entries
    : entries.filter(e => e.action_type === filterType)

  const actionTypes = [...new Set(entries.map(e => e.action_type))]

  if (loading) {
    return (
      <div className="py-8 text-center text-sm" style={{ color: 'var(--text-dim)' }}>
        Loading action history...
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="py-8 text-center text-sm" style={{ color: 'var(--text-dim)' }}>
        No actions recorded yet. Approve, deny, or add keywords to see activity here.
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
          Activity Log
        </span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {filtered.length} actions
        </span>

        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="rounded-md px-3 py-1.5 text-xs outline-none"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
        >
          <option value="all">All Actions</option>
          {actionTypes.map(t => (
            <option key={t} value={t}>{formatActionType(t)}</option>
          ))}
        </select>

        <button
          onClick={refetch}
          className="ml-auto rounded px-3 py-1.5 text-xs font-medium"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
        >
          Refresh
        </button>
      </div>

      {/* Log entries */}
      <div className="flex flex-col gap-1.5">
        {filtered.map(entry => (
          <ActionLogRow key={entry.id} entry={entry} onUndone={refetch} />
        ))}
      </div>
    </div>
  )
}

function formatActionType(type: string): string {
  const map: Record<string, string> = {
    added_as_candidate: 'Added as Candidate',
    approved: 'Approved',
    denied: 'Denied',
    undone: 'Undone',
    bulk_approved: 'Bulk Approved',
    bulk_denied: 'Bulk Denied',
    pushed_to_ads: 'Pushed to Ads',
  }
  return map[type] ?? type
}

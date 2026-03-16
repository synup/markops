'use client'

import { useState } from 'react'
import { ActionLogRow } from './ActionLogRow'
import { useActionLog, useKeywordActions, type ActionLogEntry } from '@/hooks/useKeywordActions'

export function ActionLogPanel() {
  const { entries, loading, refetch } = useActionLog(100)
  const { undoAction } = useKeywordActions()
  const [filterType, setFilterType] = useState<string>('all')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [bulkUndoing, setBulkUndoing] = useState(false)

  const filtered = filterType === 'all'
    ? entries
    : entries.filter(e => e.action_type === filterType)

  const undoable = filtered.filter(e =>
    e.action_type !== 'undone' && e.action_type !== 'pushed_to_ads' && e.previous_status !== null
  )
  const selectedUndoable = undoable.filter(e => selectedIds.has(e.id))
  const actionTypes = [...new Set(entries.map(e => e.action_type))]

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectAllUndoable = () => {
    if (undoable.every(e => selectedIds.has(e.id))) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(undoable.map(e => e.id)))
    }
  }

  const handleBulkUndo = async () => {
    if (selectedUndoable.length === 0) return
    setBulkUndoing(true)
    for (const entry of selectedUndoable) {
      await undoAction(entry)
    }
    setSelectedIds(new Set())
    setBulkUndoing(false)
    refetch()
  }

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
    <div className="relative pb-16">
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

        {undoable.length > 0 && (
          <button onClick={selectAllUndoable}
            className="rounded px-3 py-1.5 text-xs font-medium"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            {undoable.every(e => selectedIds.has(e.id)) ? 'Deselect All' : `Select All Undoable (${undoable.length})`}
          </button>
        )}

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
          <ActionLogRow
            key={entry.id}
            entry={entry}
            selected={selectedIds.has(entry.id)}
            onToggleSelect={() => toggleSelect(entry.id)}
            onUndone={refetch}
          />
        ))}
      </div>

      {/* Floating bulk undo bar */}
      {selectedUndoable.length > 0 && (
        <div
          className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-xl px-6 py-3 shadow-lg"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
        >
          <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
            {selectedUndoable.length} selected
          </span>
          <button
            onClick={handleBulkUndo}
            disabled={bulkUndoing}
            className="rounded-lg px-4 py-2 text-xs font-semibold transition-opacity disabled:opacity-50"
            style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}
          >
            {bulkUndoing ? 'Undoing...' : `Undo ${selectedUndoable.length} Actions`}
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="rounded-lg px-3 py-2 text-xs font-medium"
            style={{ color: 'var(--text-muted)' }}
          >
            Cancel
          </button>
        </div>
      )}
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

'use client'

import { useState } from 'react'
import { useKeywordActions, type ActionLogEntry } from '@/hooks/useKeywordActions'

interface ActionLogRowProps {
  entry: ActionLogEntry
  selected: boolean
  onToggleSelect: () => void
  onUndone: () => void
}

export function ActionLogRow({ entry, selected, onToggleSelect, onUndone }: ActionLogRowProps) {
  const { undoAction } = useKeywordActions()
  const [undoing, setUndoing] = useState(false)

  const canUndo = entry.action_type !== 'undone' &&
    entry.action_type !== 'pushed_to_ads' &&
    entry.previous_status !== null

  const handleUndo = async () => {
    setUndoing(true)
    const ok = await undoAction(entry)
    if (ok) onUndone()
    setUndoing(false)
  }

  const timeAgo = formatTimeAgo(entry.performed_at)
  const { icon, color } = actionStyle(entry.action_type)

  return (
    <div
      className="flex items-center gap-3 rounded-lg px-4 py-2.5 transition-colors"
      style={{
        background: selected ? 'rgba(245,158,11,0.08)' : 'var(--surface)',
        border: selected ? '1px solid rgba(245,158,11,0.3)' : '1px solid var(--border)',
        cursor: canUndo ? 'pointer' : 'default',
      }}
      onClick={canUndo ? onToggleSelect : undefined}
    >
      {/* Checkbox for undoable entries */}
      {canUndo && (
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          onClick={e => e.stopPropagation()}
          className="h-4 w-4 shrink-0 accent-amber-500"
        />
      )}

      {/* Icon */}
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
        style={{ background: `${color}15`, color }}
      >
        {icon}
      </span>

      {/* Details */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
            {entry.term}
          </span>
          <span
            className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
            style={{ background: `${color}15`, color }}
          >
            {formatActionLabel(entry.action_type)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
          {entry.campaign && <span>{entry.campaign}</span>}
          {entry.previous_status && entry.new_status && (
            <span style={{ color: 'var(--text-dim)' }}>
              {entry.previous_status} → {entry.new_status}
            </span>
          )}
        </div>
      </div>

      {/* Who + when */}
      <div className="shrink-0 text-right">
        <div className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
          {entry.performer_name || entry.performer_email || 'System'}
        </div>
        <div className="text-[10px]" style={{ color: 'var(--text-dim)' }}>
          {timeAgo}
        </div>
      </div>

      {/* Undo button */}
      {canUndo && (
        <button
          onClick={e => { e.stopPropagation(); handleUndo() }}
          disabled={undoing}
          className="shrink-0 rounded px-2.5 py-1 text-[11px] font-medium transition-opacity disabled:opacity-50"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
        >
          {undoing ? '...' : 'Undo'}
        </button>
      )}
    </div>
  )
}

function actionStyle(type: string): { icon: string; color: string } {
  switch (type) {
    case 'approved':
    case 'bulk_approved':
      return { icon: '✓', color: '#22C55E' }
    case 'denied':
    case 'bulk_denied':
      return { icon: '✕', color: '#EF4444' }
    case 'added_as_candidate':
      return { icon: '+', color: '#3B82F6' }
    case 'undone':
      return { icon: '↩', color: '#F59E0B' }
    case 'pushed_to_ads':
      return { icon: '↑', color: '#8B5CF6' }
    default:
      return { icon: '•', color: 'var(--text-dim)' }
  }
}

function formatActionLabel(type: string): string {
  const map: Record<string, string> = {
    added_as_candidate: 'Added',
    approved: 'Approved',
    denied: 'Denied',
    undone: 'Undone',
    bulk_approved: 'Bulk Approved',
    bulk_denied: 'Bulk Denied',
    pushed_to_ads: 'Pushed',
  }
  return map[type] ?? type
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  const diffDays = Math.floor(diffHrs / 24)
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

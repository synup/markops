'use client'

import { useState } from 'react'
import type { AIVisibilityCompetitor } from '@/types'

interface CompetitorRowProps {
  competitor: AIVisibilityCompetitor
  onUpdate: (id: string, updates: Partial<AIVisibilityCompetitor>) => Promise<unknown>
  onDeactivate: (id: string) => Promise<unknown>
}

export function CompetitorRow({ competitor, onUpdate, onDeactivate }: CompetitorRowProps) {
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(competitor.name)
  const [editVars, setEditVars] = useState((competitor.variations ?? []).join(', '))

  const handleSave = async () => {
    if (!editName.trim()) return
    const vars = editVars.split(',').map(v => v.trim()).filter(Boolean)
    await onUpdate(competitor.id, { name: editName.trim(), variations: vars })
    setEditing(false)
  }

  const handleToggleActive = async () => {
    if (competitor.is_active) {
      await onDeactivate(competitor.id)
    } else {
      await onUpdate(competitor.id, { is_active: true })
    }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5">
        <input
          value={editName}
          onChange={e => setEditName(e.target.value)}
          className="w-36 rounded px-2 py-1 text-xs"
          style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
          autoFocus
        />
        <input
          value={editVars}
          onChange={e => setEditVars(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          placeholder="Variations (comma-separated)"
          className="flex-1 rounded px-2 py-1 text-xs"
          style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
        />
        <button
          onClick={handleSave}
          className="rounded px-2 py-1 text-xs font-medium"
          style={{ background: '#22C55E22', color: '#22C55E' }}
        >
          Save
        </button>
        <button
          onClick={() => { setEditing(false); setEditName(competitor.name); setEditVars((competitor.variations ?? []).join(', ')) }}
          className="rounded px-2 py-1 text-xs font-medium"
          style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 transition-colors"
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <span className="w-32 shrink-0 text-xs font-medium" style={{ color: 'var(--text)' }}>
        {competitor.name}
      </span>
      <span className="flex-1 truncate text-[10px]" style={{ color: 'var(--text-dim)' }}>
        {(competitor.variations ?? []).join(', ')}
      </span>
      <button
        onClick={() => setEditing(true)}
        className="rounded px-2 py-0.5 text-[10px] font-medium"
        style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
      >
        Edit
      </button>
      <button
        onClick={handleToggleActive}
        className="rounded px-2 py-0.5 text-[10px] font-medium"
        style={{
          background: competitor.is_active ? '#EF444422' : '#22C55E22',
          color: competitor.is_active ? '#EF4444' : '#22C55E',
        }}
      >
        {competitor.is_active ? 'Deactivate' : 'Activate'}
      </button>
    </div>
  )
}

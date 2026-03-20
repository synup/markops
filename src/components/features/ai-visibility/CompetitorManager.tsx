'use client'

import { useState } from 'react'
import type { AIVisibilityCompetitor } from '@/types'
import { CompetitorRow } from './CompetitorRow'

interface CompetitorManagerProps {
  competitors: AIVisibilityCompetitor[]
  onAdd: (name: string, variations: string[]) => Promise<unknown>
  onUpdate: (id: string, updates: Partial<AIVisibilityCompetitor>) => Promise<unknown>
  onDeactivate: (id: string) => Promise<unknown>
}

export function CompetitorManager({ competitors, onAdd, onUpdate, onDeactivate }: CompetitorManagerProps) {
  const [name, setName] = useState('')
  const [variations, setVariations] = useState('')
  const [adding, setAdding] = useState(false)

  const handleAdd = async () => {
    if (!name.trim()) return
    setAdding(true)
    const vars = variations.split(',').map(v => v.trim()).filter(Boolean)
    if (!vars.includes(name.trim())) vars.unshift(name.trim())
    await onAdd(name.trim(), vars)
    setName('')
    setVariations('')
    setAdding(false)
  }

  const active = competitors.filter(c => c.is_active)
  const inactive = competitors.filter(c => !c.is_active)

  return (
    <div className="space-y-4">
      {/* Add form */}
      <div
        className="rounded-lg p-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <span className="mb-3 block text-xs font-semibold" style={{ color: 'var(--text)' }}>
          Add Competitor
        </span>
        <div className="flex items-center gap-2">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Competitor name"
            className="w-40 rounded px-3 py-1.5 text-xs"
            style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
          />
          <input
            value={variations}
            onChange={e => setVariations(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Variations (comma-separated): BrightLocal, brightlocal.com"
            className="flex-1 rounded px-3 py-1.5 text-xs"
            style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
          />
          <button
            onClick={handleAdd}
            disabled={adding || !name.trim()}
            className="rounded px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
            style={{ background: '#FF731E' }}
          >
            Add
          </button>
        </div>
      </div>

      {/* Active competitors */}
      <div
        className="rounded-lg"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
            Active Competitors ({active.length})
          </span>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
          {active.map(c => (
            <CompetitorRow key={c.id} competitor={c} onUpdate={onUpdate} onDeactivate={onDeactivate} />
          ))}
        </div>
      </div>

      {/* Inactive competitors */}
      {inactive.length > 0 && (
        <div
          className="rounded-lg"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', opacity: 0.6 }}
        >
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
              Inactive ({inactive.length})
            </span>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
            {inactive.map(c => (
              <CompetitorRow key={c.id} competitor={c} onUpdate={onUpdate} onDeactivate={onDeactivate} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

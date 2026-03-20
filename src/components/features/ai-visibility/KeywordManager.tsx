'use client'

import { useState } from 'react'
import type { AIVisibilityKeyword } from '@/types'
import { KeywordRow } from './KeywordRow'

const CATEGORIES = ['listing management', 'reputation', 'local SEO', 'social/pages', 'competitive']

interface KeywordManagerProps {
  keywords: AIVisibilityKeyword[]
  onAdd: (keyword: string, category: string) => Promise<unknown>
  onUpdate: (id: string, updates: Partial<AIVisibilityKeyword>) => Promise<unknown>
  onDeactivate: (id: string) => Promise<unknown>
}

export function KeywordManager({ keywords, onAdd, onUpdate, onDeactivate }: KeywordManagerProps) {
  const [newKeyword, setNewKeyword] = useState('')
  const [newCategory, setNewCategory] = useState(CATEGORIES[0])
  const [bulkText, setBulkText] = useState('')
  const [showBulk, setShowBulk] = useState(false)
  const [adding, setAdding] = useState(false)

  const handleAdd = async () => {
    if (!newKeyword.trim()) return
    setAdding(true)
    await onAdd(newKeyword.trim(), newCategory)
    setNewKeyword('')
    setAdding(false)
  }

  const handleBulkImport = async () => {
    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length === 0) return
    setAdding(true)
    for (const line of lines) {
      await onAdd(line, newCategory)
    }
    setBulkText('')
    setShowBulk(false)
    setAdding(false)
  }

  const active = keywords.filter(k => k.is_active)
  const inactive = keywords.filter(k => !k.is_active)

  return (
    <div className="space-y-4">
      {/* Add form */}
      <div
        className="rounded-lg p-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>Add Keyword</span>
          <button
            onClick={() => setShowBulk(!showBulk)}
            className="text-[11px] font-medium"
            style={{ color: '#00AEEF' }}
          >
            {showBulk ? 'Single add' : 'Bulk import'}
          </button>
        </div>

        {showBulk ? (
          <div className="space-y-2">
            <textarea
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              placeholder="One keyword per line..."
              rows={5}
              className="w-full rounded px-3 py-2 text-xs"
              style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
            />
            <div className="flex items-center gap-2">
              <CategorySelect value={newCategory} onChange={setNewCategory} />
              <button
                onClick={handleBulkImport}
                disabled={adding}
                className="rounded px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                style={{ background: '#FF731E' }}
              >
                {adding ? 'Importing...' : 'Import All'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              value={newKeyword}
              onChange={e => setNewKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="Enter keyword..."
              className="flex-1 rounded px-3 py-1.5 text-xs"
              style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
            />
            <CategorySelect value={newCategory} onChange={setNewCategory} />
            <button
              onClick={handleAdd}
              disabled={adding || !newKeyword.trim()}
              className="rounded px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              style={{ background: '#FF731E' }}
            >
              Add
            </button>
          </div>
        )}
      </div>

      {/* Active keywords */}
      <KeywordSection title={`Active Keywords (${active.length})`} keywords={active} onUpdate={onUpdate} onDeactivate={onDeactivate} />

      {/* Inactive keywords */}
      {inactive.length > 0 && (
        <KeywordSection title={`Inactive (${inactive.length})`} keywords={inactive} onUpdate={onUpdate} onDeactivate={onDeactivate} dimmed />
      )}
    </div>
  )
}

function KeywordSection({ title, keywords: kws, onUpdate, onDeactivate, dimmed }: {
  title: string; keywords: AIVisibilityKeyword[]; dimmed?: boolean
  onUpdate: KeywordManagerProps['onUpdate']; onDeactivate: KeywordManagerProps['onDeactivate']
}) {
  return (
    <div className="rounded-lg" style={{ background: 'var(--surface)', border: '1px solid var(--border)', opacity: dimmed ? 0.6 : 1 }}>
      <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <span className="text-xs font-semibold" style={{ color: dimmed ? 'var(--text-muted)' : 'var(--text)' }}>{title}</span>
      </div>
      <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
        {kws.map(kw => <KeywordRow key={kw.id} keyword={kw} onUpdate={onUpdate} onDeactivate={onDeactivate} />)}
      </div>
    </div>
  )
}

function CategorySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="rounded px-2 py-1.5 text-xs"
      style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
    >
      {CATEGORIES.map(c => (
        <option key={c} value={c}>{c}</option>
      ))}
    </select>
  )
}

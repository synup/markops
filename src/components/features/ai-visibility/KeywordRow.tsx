'use client'

import { useState } from 'react'
import type { AIVisibilityKeyword } from '@/types'

const CATEGORIES = ['listing management', 'reputation', 'local SEO', 'social/pages', 'competitive']

const CATEGORY_COLORS: Record<string, string> = {
  competitive: '#F59E0B',
  'listing management': '#3B82F6',
  reputation: '#8B5CF6',
  'local SEO': '#22C55E',
  'social/pages': '#EC4899',
}

interface KeywordRowProps {
  keyword: AIVisibilityKeyword
  onUpdate: (id: string, updates: Partial<AIVisibilityKeyword>) => Promise<unknown>
  onDeactivate: (id: string) => Promise<unknown>
}

export function KeywordRow({ keyword, onUpdate, onDeactivate }: KeywordRowProps) {
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(keyword.keyword)
  const [editCategory, setEditCategory] = useState(keyword.category)
  const catColor = CATEGORY_COLORS[keyword.category] ?? 'var(--text-muted)'

  const handleSave = async () => {
    if (!editText.trim()) return
    await onUpdate(keyword.id, { keyword: editText.trim(), category: editCategory })
    setEditing(false)
  }

  const handleToggleActive = async () => {
    if (keyword.is_active) {
      await onDeactivate(keyword.id)
    } else {
      await onUpdate(keyword.id, { is_active: true })
    }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5">
        <input
          value={editText}
          onChange={e => setEditText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          className="flex-1 rounded px-2 py-1 text-xs"
          style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
          autoFocus
        />
        <select
          value={editCategory}
          onChange={e => setEditCategory(e.target.value)}
          className="rounded px-2 py-1 text-xs"
          style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
        >
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button
          onClick={handleSave}
          className="rounded px-2 py-1 text-xs font-medium"
          style={{ background: '#22C55E22', color: '#22C55E' }}
        >
          Save
        </button>
        <button
          onClick={() => { setEditing(false); setEditText(keyword.keyword); setEditCategory(keyword.category) }}
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
      <span className="flex-1 text-xs font-medium" style={{ color: 'var(--text)' }}>
        {keyword.keyword}
      </span>
      <span
        className="rounded-full px-2 py-0.5 text-[10px] font-medium"
        style={{ background: `${catColor}22`, color: catColor }}
      >
        {keyword.category}
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
          background: keyword.is_active ? '#EF444422' : '#22C55E22',
          color: keyword.is_active ? '#EF4444' : '#22C55E',
        }}
      >
        {keyword.is_active ? 'Deactivate' : 'Activate'}
      </button>
    </div>
  )
}

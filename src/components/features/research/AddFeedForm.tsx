'use client'

import { useState } from 'react'

interface AddFeedFormProps {
  onAdd: (feedType: 'subreddit' | 'keyword_search', value: string, label?: string, notes?: string) => Promise<boolean>
}

export function AddFeedForm({ onAdd }: AddFeedFormProps) {
  const [feedType, setFeedType] = useState<'subreddit' | 'keyword_search'>('subreddit')
  const [value, setValue] = useState('')
  const [label, setLabel] = useState('')
  const [notes, setNotes] = useState('')
  const [adding, setAdding] = useState(false)

  const handleSubmit = async () => {
    if (!value.trim()) return
    setAdding(true)
    await onAdd(feedType, value.trim(), label.trim() || undefined, notes.trim() || undefined)
    setValue('')
    setLabel('')
    setNotes('')
    setAdding(false)
  }

  const inputStyle = { background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }

  return (
    <div
      className="mb-4 rounded-lg p-3"
      style={{ background: 'var(--surface)', border: '1px solid var(--brand-border)' }}
    >
      <div className="mb-2 flex items-center gap-2">
        <select
          value={feedType}
          onChange={e => setFeedType(e.target.value as 'subreddit' | 'keyword_search')}
          className="rounded px-2 py-1.5 text-xs"
          style={inputStyle}
        >
          <option value="subreddit">Subreddit</option>
          <option value="keyword_search">Keyword Search</option>
        </select>
        <input
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder={feedType === 'subreddit' ? 'subreddit name' : 'search keyword'}
          className="flex-1 rounded px-2.5 py-1.5 text-xs"
          style={inputStyle}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="Label (optional)"
          className="flex-1 rounded px-2.5 py-1.5 text-xs"
          style={inputStyle}
        />
        <input
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          className="flex-1 rounded px-2.5 py-1.5 text-xs"
          style={inputStyle}
        />
        <button
          onClick={handleSubmit}
          disabled={adding || !value.trim()}
          className="btn-research rounded px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          style={{ background: 'var(--brand)' }}
        >
          {adding ? 'Adding...' : 'Add'}
        </button>
      </div>
    </div>
  )
}

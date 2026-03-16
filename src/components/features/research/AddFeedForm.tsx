'use client'

import { useState } from 'react'

const KEYWORD_CATEGORIES = [
  'brand_monitoring',
  'category',
  'competitor',
  'intent',
  'pain_point',
]

interface AddFeedFormProps {
  onAdd: (type: 'subreddit' | 'keyword', value: string, label?: string, category?: string) => Promise<boolean>
}

export function AddFeedForm({ onAdd }: AddFeedFormProps) {
  const [type, setType] = useState<'subreddit' | 'keyword'>('subreddit')
  const [value, setValue] = useState('')
  const [label, setLabel] = useState('')
  const [category, setCategory] = useState(KEYWORD_CATEGORIES[0])
  const [adding, setAdding] = useState(false)

  const handleSubmit = async () => {
    if (!value.trim()) return
    setAdding(true)
    await onAdd(type, value.trim(), label.trim() || undefined, type === 'keyword' ? category : undefined)
    setValue('')
    setLabel('')
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
          value={type}
          onChange={e => setType(e.target.value as 'subreddit' | 'keyword')}
          className="rounded px-2 py-1.5 text-xs"
          style={inputStyle}
        >
          <option value="subreddit">Subreddit</option>
          <option value="keyword">Keyword</option>
        </select>
        <input
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder={type === 'subreddit' ? 'subreddit name' : 'search keyword'}
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
        {type === 'keyword' && (
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="rounded px-2 py-1.5 text-xs"
            style={inputStyle}
          >
            {KEYWORD_CATEGORIES.map(c => (
              <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
            ))}
          </select>
        )}
        <button
          onClick={handleSubmit}
          disabled={adding || !value.trim()}
          className="rounded px-3 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50"
          style={{ background: 'var(--brand)' }}
        >
          {adding ? 'Adding...' : 'Add'}
        </button>
      </div>
    </div>
  )
}

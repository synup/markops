'use client'

import { useState } from 'react'
import { useFeedSources } from '@/hooks/useRedditResearch'
import { FeedSourceRow } from './FeedSourceRow'

export function FeedSourceManager() {
  const { sources, loading, addSource, removeSource, toggleSource } = useFeedSources()
  const [newType, setNewType] = useState<'subreddit' | 'keyword'>('subreddit')
  const [newValue, setNewValue] = useState('')
  const [adding, setAdding] = useState(false)

  const handleAdd = async () => {
    const trimmed = newValue.trim()
    if (!trimmed) return
    setAdding(true)
    await addSource(newType, trimmed)
    setNewValue('')
    setAdding(false)
  }

  if (loading) {
    return <div className="py-8 text-center text-sm" style={{ color: 'var(--text-dim)' }}>Loading feeds...</div>
  }

  const subreddits = sources.filter(s => s.type === 'subreddit')
  const keywords = sources.filter(s => s.type === 'keyword')

  return (
    <div>
      {/* Add new source */}
      <div
        className="mb-4 flex items-center gap-2 rounded-lg p-3"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <select
          value={newType}
          onChange={e => setNewType(e.target.value as 'subreddit' | 'keyword')}
          className="rounded px-2 py-1.5 text-xs"
          style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}
        >
          <option value="subreddit">Subreddit</option>
          <option value="keyword">Keyword</option>
        </select>
        <input
          value={newValue}
          onChange={e => setNewValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder={newType === 'subreddit' ? 'subreddit name' : 'search keyword'}
          className="flex-1 rounded px-2.5 py-1.5 text-xs"
          style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}
        />
        <button
          onClick={handleAdd}
          disabled={adding || !newValue.trim()}
          className="rounded px-3 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50"
          style={{ background: 'var(--brand)' }}
        >
          {adding ? 'Adding...' : 'Add'}
        </button>
      </div>

      {/* Subreddits */}
      <SectionLabel label="Subreddits" count={subreddits.length} />
      <div className="mb-4 flex flex-col gap-1">
        {subreddits.map(s => (
          <FeedSourceRow key={s.id} source={s} onToggle={toggleSource} onRemove={removeSource} />
        ))}
      </div>

      {/* Keywords */}
      <SectionLabel label="Keyword Searches" count={keywords.length} />
      <div className="flex flex-col gap-1">
        {keywords.map(s => (
          <FeedSourceRow key={s.id} source={s} onToggle={toggleSource} onRemove={removeSource} />
        ))}
      </div>
    </div>
  )
}

function SectionLabel({ label, count }: { label: string; count: number }) {
  return (
    <div className="mb-2 flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
      {label}
      <span className="rounded px-1.5 py-0.5 text-[10px]" style={{ background: 'var(--surface-2)' }}>
        {count}
      </span>
    </div>
  )
}

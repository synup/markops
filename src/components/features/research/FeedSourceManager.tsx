'use client'

import { useState } from 'react'
import { useFeedSources } from '@/hooks/useRedditResearch'
import { FeedSourceRow } from './FeedSourceRow'
import { AddFeedForm } from './AddFeedForm'

export function FeedSourceManager() {
  const { sources, loading, addSource, removeSource, toggleSource } = useFeedSources()
  const [showForm, setShowForm] = useState(false)

  if (loading) {
    return <div className="py-8 text-center text-sm" style={{ color: 'var(--text-dim)' }}>Loading feeds...</div>
  }

  const subreddits = sources.filter(s => s.feed_type === 'subreddit')
  const keywords = sources.filter(s => s.feed_type === 'keyword_search')

  return (
    <div>
      {/* Header with add button */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
          Feed Sources ({sources.length})
        </span>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-research rounded px-2.5 py-1 text-xs font-medium text-white"
          style={{ background: 'var(--brand)' }}
        >
          {showForm ? 'Cancel' : '+ Add Feed'}
        </button>
      </div>

      {showForm && (
        <AddFeedForm
          onAdd={async (feedType, value, label, notes) => {
            const ok = await addSource(feedType, value, label, notes)
            if (ok) setShowForm(false)
            return ok
          }}
        />
      )}

      {/* Subreddits section */}
      <SectionLabel label="Subreddits" count={subreddits.length} />
      <div className="mb-4 flex flex-col gap-1">
        {subreddits.map(s => (
          <FeedSourceRow key={s.id} source={s} onToggle={toggleSource} onRemove={removeSource} />
        ))}
        {!subreddits.length && <EmptyMsg text="No subreddits configured." />}
      </div>

      {/* Keyword searches section */}
      <SectionLabel label="Keyword Searches" count={keywords.length} />
      <div className="flex flex-col gap-1">
        {keywords.map(s => (
          <FeedSourceRow key={s.id} source={s} onToggle={toggleSource} onRemove={removeSource} />
        ))}
        {!keywords.length && <EmptyMsg text="No keyword feeds configured." />}
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

function EmptyMsg({ text }: { text: string }) {
  return <div className="py-2 text-center text-xs" style={{ color: 'var(--text-dim)' }}>{text}</div>
}

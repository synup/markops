'use client'

import { useSubredditSuggestions } from '@/hooks/useRedditResearch'

export function SubredditSuggestionsList() {
  const { suggestions, loading, updateStatus } = useSubredditSuggestions()

  if (loading) {
    return <div className="py-4 text-center text-sm" style={{ color: 'var(--text-dim)' }}>Loading suggestions...</div>
  }

  const pending = suggestions.filter(s => s.status === 'pending')
  if (!pending.length && !suggestions.length) {
    return <div className="py-4 text-center text-sm" style={{ color: 'var(--text-dim)' }}>No subreddit suggestions.</div>
  }

  return (
    <div>
      <div className="mb-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
        Subreddit Suggestions ({pending.length} pending)
      </div>
      <div className="flex flex-col gap-1">
        {suggestions.map(s => (
          <div
            key={s.id}
            className="flex items-center justify-between rounded-lg px-3 py-2"
            style={{
              background: 'var(--surface)',
              border: `1px solid ${s.status === 'pending' ? 'var(--border)' : s.status === 'approved' ? 'var(--green)' : 'var(--red)'}`,
              opacity: s.status === 'pending' ? 1 : 0.6,
            }}
          >
            <div>
              <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>
                r/{s.subreddit}
              </span>
              {s.reason && (
                <span className="ml-2 text-xs" style={{ color: 'var(--text-dim)' }}>
                  — {s.reason}
                </span>
              )}
            </div>
            {s.status === 'pending' ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => updateStatus(s.id, 'approved')}
                  className="rounded px-2 py-0.5 text-[10px] font-medium"
                  style={{ background: 'var(--green-muted)', color: 'var(--green)' }}
                >
                  Add
                </button>
                <button
                  onClick={() => updateStatus(s.id, 'rejected')}
                  className="rounded px-2 py-0.5 text-[10px] font-medium"
                  style={{ background: 'var(--red-muted)', color: 'var(--red)' }}
                >
                  Skip
                </button>
              </div>
            ) : (
              <span
                className="text-[10px] font-medium"
                style={{ color: s.status === 'approved' ? 'var(--green)' : 'var(--red)' }}
              >
                {s.status}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useBrandAlerts } from '@/hooks/useRedditResearch'

export function BrandAlertBanner() {
  const { mentions, count, loading } = useBrandAlerts()
  const [expanded, setExpanded] = useState(false)

  if (loading || count === 0) return null

  return (
    <div
      className="mx-6 mt-4 rounded-lg px-4 py-2.5"
      style={{ background: 'var(--yellow-muted, rgba(245,158,11,0.1))', border: '1px solid var(--yellow, #F59E0B)' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: 'var(--yellow, #F59E0B)' }}>
          ⚠ {count} brand mention{count !== 1 ? 's' : ''} need{count === 1 ? 's' : ''} attention
        </span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="btn-research rounded px-2 py-0.5 text-[10px] font-medium"
          style={{ background: 'var(--surface)', color: 'var(--yellow, #F59E0B)', border: '1px solid var(--border)' }}
        >
          {expanded ? 'Hide' : 'View'}
        </button>
      </div>
      {expanded && (
        <div className="mt-2 flex flex-col gap-1">
          {mentions.map(m => (
            <a
              key={m.id}
              href={m.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded px-2 py-1 text-xs transition-colors hover:opacity-80"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="min-w-0 flex-1">
                <span className="truncate font-medium" style={{ color: 'var(--text)' }}>{m.title}</span>
                <span className="ml-2 text-[10px]" style={{ color: 'var(--text-dim)' }}>r/{m.subreddit}</span>
              </div>
              <span className="ml-2 shrink-0 text-[10px]" style={{ color: 'var(--text-dim)' }}>{m.upvotes} pts</span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

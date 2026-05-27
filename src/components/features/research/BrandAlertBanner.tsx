'use client'

import { useState } from 'react'
import { useBrandAlerts } from '@/hooks/useRedditResearch'

export function BrandAlertBanner() {
  const { mentions, count, loading } = useBrandAlerts()
  const [expanded, setExpanded] = useState(false)

  if (loading || count === 0) return null

  return (
    <div className="mx-6 mt-4 rounded-lg border-[0.5px] border-amber-200 bg-amber-50 px-4 py-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-amber-800">
          ⚠ {count} brand mention{count !== 1 ? 's' : ''} need{count === 1 ? 's' : ''} attention
        </span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="rounded border-[0.5px] border-amber-300 bg-white px-2 py-0.5 text-[11px] font-medium text-amber-700 transition-colors duration-150 hover:bg-amber-100"
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
              className="flex items-center justify-between rounded border-[0.5px] border-amber-200 bg-white px-2 py-1 text-[12px] transition-colors duration-150 hover:bg-amber-100"
            >
              <div className="min-w-0 flex-1">
                <span className="truncate font-medium text-slate-900">{m.title}</span>
                <span className="ml-2 text-[11px] text-slate-500">r/{m.subreddit}</span>
              </div>
              <span className="ml-2 shrink-0 text-[11px] text-slate-500">{m.upvotes} pts</span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

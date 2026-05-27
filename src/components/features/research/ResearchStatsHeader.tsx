'use client'

import type { ResearchStats } from '@/hooks/useRedditResearch'

interface ResearchStatsHeaderProps {
  stats: ResearchStats | null
  loading: boolean
}

const CARDS = [
  { key: 'totalPosts',       label: 'Reddit Posts',     valueColor: 'text-slate-900' },
  { key: 'toolIdeas',        label: 'Tool Ideas',       valueColor: 'text-cyan-700' },
  { key: 'contentIdeas',     label: 'Content Ideas',    valueColor: 'text-blue-700' },
  { key: 'approvedTools',    label: 'Tools Approved',   valueColor: 'text-emerald-700' },
  { key: 'approvedContent',  label: 'Content Approved', valueColor: 'text-emerald-700' },
  { key: 'feedSources',      label: 'Active Feeds',     valueColor: 'text-amber-700' },
] as const

export function ResearchStatsHeader({ stats, loading }: ResearchStatsHeaderProps) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-3 gap-3 px-6 pt-4 md:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[78px] animate-pulse rounded-lg border-[0.5px] border-slate-200 bg-white" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-3 px-6 pt-4 md:grid-cols-6">
      {CARDS.map(card => (
        <div key={card.key} className="rounded-lg border-[0.5px] border-slate-200 bg-white p-4">
          <div className="text-[12px] font-medium text-slate-500">{card.label}</div>
          <div className={`mt-1 text-[24px] font-semibold tabular-nums ${card.valueColor}`}>
            {stats[card.key as keyof ResearchStats]}
          </div>
        </div>
      ))}
    </div>
  )
}

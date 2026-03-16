'use client'

import { StatCard } from '@/components/ui/StatCard'
import type { ResearchStats } from '@/hooks/useRedditResearch'

interface ResearchStatsHeaderProps {
  stats: ResearchStats | null
  loading: boolean
}

export function ResearchStatsHeader({ stats, loading }: ResearchStatsHeaderProps) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-3 gap-3 p-6 pb-0 md:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-[82px] animate-pulse rounded-lg"
            style={{ background: 'var(--surface)' }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-3 p-6 pb-0 md:grid-cols-6">
      <StatCard label="Reddit Posts" value={stats.totalPosts} color="var(--text)" />
      <StatCard label="Tool Ideas" value={stats.toolIdeas} color="var(--brand)" />
      <StatCard label="Content Ideas" value={stats.contentIdeas} color="var(--blue)" />
      <StatCard label="Tools Approved" value={stats.approvedTools} color="var(--green)" />
      <StatCard label="Content Approved" value={stats.approvedContent} color="var(--green)" />
      <StatCard label="Active Feeds" value={stats.feedSources} color="var(--yellow)" />
    </div>
  )
}

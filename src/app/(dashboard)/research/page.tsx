'use client'

import { useState } from 'react'
import { ResearchStatsHeader } from '@/components/features/research/ResearchStatsHeader'
import { ToolIdeasList } from '@/components/features/research/ToolIdeasList'
import { ContentIdeasList } from '@/components/features/research/ContentIdeasList'
import { FeedTab } from '@/components/features/research/FeedTab'
import { AgentsTab } from '@/components/features/research/AgentsTab'
import { ScoreNowButton } from '@/components/features/research/ScoreNowButton'
import { BrandAlertBanner } from '@/components/features/research/BrandAlertBanner'
import { useResearchStats } from '@/hooks/useRedditResearch'

type Tab = 'tool_ideas' | 'content_ideas' | 'feed' | 'agents'

const TABS: { key: Tab; label: string }[] = [
  { key: 'tool_ideas', label: 'Tool Ideas' },
  { key: 'content_ideas', label: 'Content Ideas' },
  { key: 'feed', label: 'Feed' },
  { key: 'agents', label: 'Agents' },
]

export default function ResearchPage() {
  const { stats, loading } = useResearchStats()
  const [activeTab, setActiveTab] = useState<Tab>('tool_ideas')

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex items-start justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <h1 className="text-[20px] font-semibold text-slate-900">Reddit Research</h1>
          <p className="mt-0.5 text-[13px] text-slate-500">Tool & content idea discovery from Reddit</p>
        </div>
        <ScoreNowButton />
      </div>

      <BrandAlertBanner />
      <ResearchStatsHeader stats={stats} loading={loading} />

      <div className="border-b border-slate-200 bg-white px-6">
        <div className="flex gap-0">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-[13px] font-medium transition-colors duration-150 ${
                activeTab === tab.key
                  ? 'border-b-2 border-cyan-500 text-cyan-700'
                  : 'border-b-2 border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'tool_ideas' && <ToolIdeasList />}
        {activeTab === 'content_ideas' && <ContentIdeasList />}
        {activeTab === 'feed' && <FeedTab />}
        {activeTab === 'agents' && <AgentsTab />}
      </div>
    </div>
  )
}

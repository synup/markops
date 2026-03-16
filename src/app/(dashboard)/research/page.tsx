'use client'

import { useState } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { ResearchStatsHeader } from '@/components/features/research/ResearchStatsHeader'
import { ToolIdeasList } from '@/components/features/research/ToolIdeasList'
import { ContentIdeasList } from '@/components/features/research/ContentIdeasList'
import { FeedTab } from '@/components/features/research/FeedTab'
import { useResearchStats } from '@/hooks/useRedditResearch'

type Tab = 'tool_ideas' | 'content_ideas' | 'feed'

const TABS: { key: Tab; label: string }[] = [
  { key: 'tool_ideas', label: 'Tool Ideas' },
  { key: 'content_ideas', label: 'Content Ideas' },
  { key: 'feed', label: 'Feed' },
]

export default function ResearchPage() {
  const { stats, loading } = useResearchStats()
  const [activeTab, setActiveTab] = useState<Tab>('tool_ideas')

  return (
    <>
      <Topbar title="Reddit Research" subtitle="Tool & content idea discovery from Reddit" />
      <ResearchStatsHeader stats={stats} loading={loading} />

      {/* Tab bar */}
      <div className="flex gap-0 border-b px-6 mt-4" style={{ borderColor: 'var(--border)' }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-4 py-2.5 text-xs font-medium"
            style={{
              color: activeTab === tab.key ? 'var(--brand)' : 'var(--text-muted)',
              borderBottom: activeTab === tab.key ? '2px solid var(--brand)' : '2px solid transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {activeTab === 'tool_ideas' && <ToolIdeasList />}
        {activeTab === 'content_ideas' && <ContentIdeasList />}
        {activeTab === 'feed' && <FeedTab />}
      </div>
    </>
  )
}

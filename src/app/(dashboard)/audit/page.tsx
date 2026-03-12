'use client'

import { Topbar } from '@/components/layout/Topbar'
import { AuditScoreHeader } from '@/components/features/audit/AuditScoreHeader'
import { AuditTriggerButton } from '@/components/features/audit/AuditTriggerButton'
import { SearchTermsPanel } from '@/components/features/audit/SearchTermsPanel'
import { ExpansionPanel } from '@/components/features/audit/ExpansionPanel'
import { PausePanel } from '@/components/features/audit/PausePanel'
import { NegativeKeywordsList } from '@/components/features/keywords/NegativeKeywordsList'
import { useLatestAudit, useNegativeKeywords } from '@/hooks/useAuditData'
import { useState } from 'react'
import type { AuditRun } from '@/types'

type Tab = 'search_terms' | 'negatives' | 'expansion' | 'pause' | 'issues'

const TABS: { key: Tab; label: string }[] = [
  { key: 'search_terms', label: 'Search Terms' },
  { key: 'negatives', label: 'Negative Keywords' },
  { key: 'expansion', label: 'Keyword Expansion' },
  { key: 'pause', label: 'Keywords to Pause' },
  { key: 'issues', label: 'Audit Issues' },
]

export default function AuditPage() {
  const { audit, loading } = useLatestAudit()
  const [activeTab, setActiveTab] = useState<Tab>('search_terms')
  const topActions = <AuditTriggerButton />

  if (loading) {
    return (
      <>
        <Topbar title="Adwords Audit" subtitle="PPC" actions={topActions} />
        <div className="py-20 text-center text-sm" style={{ color: 'var(--text-dim)' }}>Loading...</div>
      </>
    )
  }

  if (!audit) {
    return (
      <>
        <Topbar title="Adwords Audit" subtitle="PPC" actions={topActions} />
        <div className="flex flex-col items-center justify-center py-20">
          <p className="mb-4 text-sm" style={{ color: 'var(--text-muted)' }}>No audit data yet.</p>
          <AuditTriggerButton />
        </div>
      </>
    )
  }

  return (
    <>
      <Topbar title="Adwords Audit" subtitle="PPC" actions={topActions} />
      <AuditScoreHeader audit={audit} />
      <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="p-6">
        {activeTab === 'search_terms' && <SearchTermsPanel auditRunId={audit.id} />}
        {activeTab === 'negatives' && <NegativesPanel auditRunId={audit.id} />}
        {activeTab === 'expansion' && <ExpansionPanel auditRunId={audit.id} />}
        {activeTab === 'pause' && <PausePanel auditRunId={audit.id} />}
        {activeTab === 'issues' && <IssuesPanel audit={audit} />}
      </div>
    </>
  )
}

function TabBar({ tabs, activeTab, onTabChange }: {
  tabs: { key: Tab; label: string }[]
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}) {
  return (
    <div className="flex gap-0 border-b px-6" style={{ borderColor: 'var(--border)' }}>
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
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
  )
}

function IssuesPanel({ audit }: { audit: AuditRun }) {
  const parseArr = (val: unknown) => Array.isArray(val) ? val : typeof val === 'string' ? JSON.parse(val) : []
  const issues = [...parseArr(audit.critical_issues), ...parseArr(audit.quick_wins)]
  if (!issues.length) return <p className="py-8 text-center text-sm" style={{ color: 'var(--text-dim)' }}>No issues.</p>
  return (
    <div className="flex flex-col gap-2">
      {issues.map((issue, i) => (
        <div key={i} className="rounded-lg p-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>{issue.title}</div>
          <div className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>{issue.description}</div>
        </div>
      ))}
    </div>
  )
}

function NegativesPanel({ auditRunId }: { auditRunId: number }) {
  const { keywords, loading, updateStatus } = useNegativeKeywords(auditRunId)
  if (loading) return <div className="py-8 text-center text-sm" style={{ color: 'var(--text-dim)' }}>Loading...</div>
  return <NegativeKeywordsList keywords={keywords} onUpdateStatus={updateStatus} />
}

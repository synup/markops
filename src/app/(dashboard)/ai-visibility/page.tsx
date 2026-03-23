'use client'

import { useState } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { RunControls } from '@/components/features/ai-visibility/RunControls'
import { SynupResultsTable } from '@/components/features/ai-visibility/SynupResultsTable'
import { CompetitorResultsTable } from '@/components/features/ai-visibility/CompetitorResultsTable'
import { KeywordManager } from '@/components/features/ai-visibility/KeywordManager'
import { CompetitorManager } from '@/components/features/ai-visibility/CompetitorManager'
import { TableSkeleton, EmptyState, ErrorBanner } from '@/components/features/ai-visibility/LoadingSkeleton'
import { useAIVisibility } from '@/hooks/useAIVisibility'

const TABS = ['OpenAI Results', 'Claude Results', 'Keywords', 'Competitors'] as const
type Tab = typeof TABS[number]

const MODEL_MAP: Record<string, string> = {
  'OpenAI Results': 'gpt-4o',
  'Claude Results': 'claude-sonnet',
}

export default function AIVisibilityPage() {
  const [activeTab, setActiveTab] = useState<Tab>('OpenAI Results')
  const [selectedRunId, setSelectedRunId] = useState<string | undefined>()
  const [triggering, setTriggering] = useState(false)

  const {
    runs, latestRun, keywords, competitors,
    synupSummaries, competitorSummaries,
    loading, error, frequency,
    addKeyword, updateKeyword, deactivateKeyword,
    addCompetitor, updateCompetitor, deactivateCompetitor,
    triggerRun, updateFrequency, fetchPositionHistory, refetch,
  } = useAIVisibility(selectedRunId)

  const handleTrigger = async () => {
    setTriggering(true)
    await triggerRun()
    setTriggering(false)
  }

  const model = MODEL_MAP[activeTab]
  const hasResults = model && (synupSummaries[model]?.length ?? 0) > 0
  const hasNoRuns = !loading && runs.filter(r => r.status === 'completed').length === 0

  return (
    <>
      <Topbar
        title="AI Visibility Tracker"
        subtitle="Track Synup mentions across LLM recommendations"
        actions={
          <RunControls
            latestRun={latestRun}
            runs={runs}
            selectedRunId={selectedRunId}
            onSelectRun={setSelectedRunId}
            onTriggerRun={handleTrigger}
            triggering={triggering}
            frequency={frequency}
            onFrequencyChange={updateFrequency}
          />
        }
      />

      <div className="flex-1 overflow-y-auto p-6" style={{ background: 'var(--bg)' }}>
        {/* Tabs */}
        <div
          className="mb-4 flex gap-0 rounded-lg"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 px-4 py-2.5 text-xs font-semibold transition-colors"
              style={{
                color: activeTab === tab ? 'var(--text)' : 'var(--text-muted)',
                background: activeTab === tab ? 'var(--surface-2)' : 'transparent',
                borderBottom: activeTab === tab ? '2px solid #FF731E' : '2px solid transparent',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {error && <ErrorBanner message={error} onRetry={refetch} />}

        {loading ? (
          <div className="space-y-4">
            <TableSkeleton rows={6} />
            <TableSkeleton rows={4} />
          </div>
        ) : (
          <>
            {(activeTab === 'OpenAI Results' || activeTab === 'Claude Results') && (
              <div className="space-y-4">
                {hasNoRuns ? (
                  <EmptyState message="No data yet — trigger your first run to see AI visibility results." />
                ) : !hasResults ? (
                  <EmptyState message={`No results for ${activeTab.replace(' Results', '')} yet. Run a check to populate data.`} />
                ) : (
                  <>
                    <SynupResultsTable
                      model={model}
                      summaries={synupSummaries[model] ?? []}
                      onFetchHistory={fetchPositionHistory}
                    />
                    <CompetitorResultsTable model={model} summaries={competitorSummaries[model] ?? []} />
                  </>
                )}
              </div>
            )}

            {activeTab === 'Keywords' && (
              <KeywordManager
                keywords={keywords}
                onAdd={addKeyword}
                onUpdate={updateKeyword}
                onDeactivate={deactivateKeyword}
              />
            )}

            {activeTab === 'Competitors' && (
              <CompetitorManager
                competitors={competitors}
                onAdd={addCompetitor}
                onUpdate={updateCompetitor}
                onDeactivate={deactivateCompetitor}
              />
            )}
          </>
        )}
      </div>
    </>
  )
}

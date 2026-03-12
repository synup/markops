'use client'

import { useState } from 'react'
import { SearchTermRow } from './SearchTermRow'
import { useSearchTerms, useCampaignList } from '@/hooks/useSearchTerms'
import { createClient } from '@/lib/supabase/client'

interface SearchTermsPanelProps {
  auditRunId: number
}

type FilterType = 'all' | 'negative_candidate' | 'expansion_candidate' | 'wasted_spend'

export function SearchTermsPanel({ auditRunId }: SearchTermsPanelProps) {
  const [selectedCampaign, setSelectedCampaign] = useState<string>('')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const { terms, loading } = useSearchTerms(auditRunId, selectedCampaign || undefined)
  const campaigns = useCampaignList(auditRunId)

  const filtered = terms.filter(t => {
    if (filterType !== 'all' && t.term_type !== filterType) return false
    if (searchQuery && !t.search_term.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const handleAddNegative = async (termId: number, term: string, campaign: string) => {
    const supabase = createClient()
    await supabase.from('negative_keywords').insert({
      audit_run_id: auditRunId,
      term,
      campaign,
      match_type: 'exact',
      status: 'approved',
    })
  }

  if (loading) {
    return <div className="py-8 text-center text-sm" style={{ color: 'var(--text-dim)' }}>Loading search terms...</div>
  }

  return (
    <div>
      {/* Filters row */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={selectedCampaign}
          onChange={e => setSelectedCampaign(e.target.value)}
          className="rounded-md px-3 py-1.5 text-xs outline-none"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
        >
          <option value="">All Campaigns</option>
          {campaigns.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value as FilterType)}
          className="rounded-md px-3 py-1.5 text-xs outline-none"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
        >
          <option value="all">All Types</option>
          <option value="negative_candidate">Negative Candidates</option>
          <option value="expansion_candidate">Expansion Candidates</option>
          <option value="wasted_spend">Wasted Spend</option>
        </select>

        <input
          type="text"
          placeholder="Search terms..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="rounded-md px-3 py-1.5 text-xs outline-none"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
        />

        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {filtered.length} terms · ${filtered.reduce((s, t) => s + t.cost, 0).toFixed(2)} total cost
        </span>
      </div>

      {/* Terms list */}
      <div className="flex flex-col gap-1.5">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-sm" style={{ color: 'var(--text-dim)' }}>
            No search terms match your filters.
          </div>
        ) : (
          filtered.map(term => (
            <SearchTermRow key={term.id} term={term} onAddAsNegative={handleAddNegative} />
          ))
        )}
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { SearchTermRow } from './SearchTermRow'
import { useSearchTerms, useCampaignList } from '@/hooks/useSearchTerms'
import { useKeywordActions } from '@/hooks/useKeywordActions'
import { createClient } from '@/lib/supabase/client'

interface SearchTermsPanelProps {
  auditRunId: number
}

type FilterType = 'all' | 'negative_candidate' | 'expansion_candidate' | 'wasted_spend'

export function SearchTermsPanel({ auditRunId }: SearchTermsPanelProps) {
  const [selectedCampaign, setSelectedCampaign] = useState<string>('')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [addedTerms, setAddedTerms] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [insertError, setInsertError] = useState<string | null>(null)
  const { terms, loading } = useSearchTerms(auditRunId, selectedCampaign || undefined)
  const campaigns = useCampaignList(auditRunId)
  const { logBulkActions } = useKeywordActions()

  // Load existing negative keywords to mark already-added terms
  useEffect(() => {
    async function loadExisting() {
      const supabase = createClient()
      const { data } = await supabase
        .from('negative_keywords')
        .select('term')
        .eq('audit_run_id', auditRunId)
      if (data) {
        setAddedTerms(new Set(data.map(d => d.term.toLowerCase())))
      }
    }
    loadExisting()
  }, [auditRunId])

  const filtered = terms.filter(t => {
    if (filterType !== 'all' && t.term_type !== filterType) return false
    if (searchQuery && !t.search_term.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const negCandidates = filtered.filter(
    t => (t.term_type === 'negative_candidate' || t.term_type === 'wasted_spend') && !addedTerms.has(t.search_term.toLowerCase())
  )
  const selectedTerms = filtered.filter(t => selectedIds.has(t.id))
  const selectedCost = selectedTerms.reduce((s, t) => s + t.cost, 0)

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectAllNegCandidates = () => {
    const allNegIds = negCandidates.map(t => t.id)
    const allSelected = allNegIds.every(id => selectedIds.has(id))
    if (allSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev)
        allNegIds.forEach(id => next.delete(id))
        return next
      })
    } else {
      setSelectedIds(prev => new Set([...prev, ...allNegIds]))
    }
  }

  const handleSubmitAsNegatives = async () => {
    if (selectedTerms.length === 0) return
    setSubmitting(true)
    setInsertError(null)
    const supabase = createClient()
    const rows = selectedTerms.map(t => ({
      audit_run_id: auditRunId,
      term: t.search_term,
      campaign: t.campaign,
      match_type: t.suggested_match_type?.toLowerCase() || 'exact',
      category: Array.isArray(t.categories) ? t.categories.join(', ') : '',
      impressions: t.impressions,
      clicks: t.clicks,
      cost: t.cost,
      conversions: t.conversions,
      status: 'candidate',
    }))
    const { data: inserted, error } = await supabase.from('negative_keywords').insert(rows).select('id, term, campaign')
    if (error) {
      setInsertError(`Failed to add keywords: ${error.message}`)
      setSubmitting(false)
      return
    }
    if (inserted) {
      // Log all actions to audit trail
      await logBulkActions(inserted.map(row => ({
        action_type: 'added_as_candidate',
        keyword_id: row.id,
        term: row.term,
        campaign: row.campaign,
        previous_status: undefined,
        new_status: 'candidate',
        metadata: { source: 'search_terms_panel', audit_run_id: auditRunId },
      })))
      // Mark these terms as added in UI
      setAddedTerms(prev => {
        const next = new Set(prev)
        selectedTerms.forEach(t => next.add(t.search_term.toLowerCase()))
        return next
      })
      setSelectedIds(new Set())
    }
    setSubmitting(false)
  }

  if (loading) {
    return <div className="py-8 text-center text-sm" style={{ color: 'var(--text-dim)' }}>Loading search terms...</div>
  }

  return (
    <div>
      {/* Filters row */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select value={selectedCampaign} onChange={e => setSelectedCampaign(e.target.value)}
          className="rounded-md px-3 py-1.5 text-xs outline-none"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}>
          <option value="">All Campaigns</option>
          {campaigns.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select value={filterType} onChange={e => setFilterType(e.target.value as FilterType)}
          className="rounded-md px-3 py-1.5 text-xs outline-none"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}>
          <option value="all">All Types</option>
          <option value="negative_candidate">Negative Candidates</option>
          <option value="expansion_candidate">Expansion Candidates</option>
          <option value="wasted_spend">Wasted Spend</option>
        </select>

        <input type="text" placeholder="Search terms..." value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="rounded-md px-3 py-1.5 text-xs outline-none"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }} />

        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {filtered.length} terms · ${filtered.reduce((s, t) => s + t.cost, 0).toFixed(2)} total cost
        </span>

        {negCandidates.length > 0 && (
          <button onClick={selectAllNegCandidates}
            className="ml-auto rounded px-3 py-1.5 text-xs font-medium"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            {negCandidates.every(t => selectedIds.has(t.id)) ? 'Deselect All' : `Select All (${negCandidates.length})`}
          </button>
        )}
      </div>

      {/* Error message */}
      {insertError && (
        <div className="mb-3 rounded-lg px-4 py-2.5 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}>
          {insertError}
        </div>
      )}

      {/* Terms list */}
      <div className="flex flex-col gap-1.5">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-sm" style={{ color: 'var(--text-dim)' }}>
            No search terms match your filters.
          </div>
        ) : (
          filtered.map(term => (
            <SearchTermRow
              key={term.id}
              term={term}
              selected={selectedIds.has(term.id)}
              alreadyAdded={addedTerms.has(term.search_term.toLowerCase())}
              onToggleSelect={() => toggleSelect(term.id)}
            />
          ))
        )}
      </div>

      {/* Floating action bar */}
      <SelectionActionBar
        count={selectedTerms.length}
        cost={selectedCost}
        submitting={submitting}
        onSubmit={handleSubmitAsNegatives}
        onClear={() => setSelectedIds(new Set())}
      />
    </div>
  )
}

function SelectionActionBar({ count, cost, submitting, onSubmit, onClear }: {
  count: number; cost: number; submitting: boolean; onSubmit: () => void; onClear: () => void
}) {
  if (count === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-xl px-5 py-3 shadow-lg"
      style={{ background: '#1e1e2e', border: '1px solid var(--border)' }}>
      <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
        {count} selected · ${cost.toFixed(2)} wasted
      </span>
      <button onClick={onSubmit} disabled={submitting}
        className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
        style={{ background: '#EF4444' }}>
        {submitting ? 'Adding...' : 'Add to Negative Candidates'}
      </button>
      <button onClick={onClear}
        className="rounded-lg px-3 py-2 text-xs font-medium"
        style={{ color: 'var(--text-muted)' }}>
        Clear
      </button>
    </div>
  )
}

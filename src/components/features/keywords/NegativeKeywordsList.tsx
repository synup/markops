'use client'

import { useState, useMemo } from 'react'
import { GroupedKeywordRow } from './GroupedKeywordRow'
import { PushToAdsButton } from './PushToAdsButton'
import { useKeywordActions } from '@/hooks/useKeywordActions'
import type { NegativeKeyword } from '@/types'

interface NegativeKeywordsListProps {
  keywords: NegativeKeyword[]
  onUpdateStatus: (id: number, status: NegativeKeyword['status']) => Promise<boolean>
}

type StatusFilter = 'all' | 'candidate' | 'approved' | 'denied'

export function NegativeKeywordsList({ keywords, onUpdateStatus }: NegativeKeywordsListProps) {
  const [filter, setFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const { logAction, logBulkActions } = useKeywordActions()

  // Extract unique categories from all keywords
  const categories = useMemo(() => {
    const cats = new Set<string>()
    for (const k of keywords) {
      if (k.category) cats.add(k.category)
    }
    return [...cats].sort()
  }, [keywords])

  const filtered = keywords.filter(k => {
    if (statusFilter !== 'all' && k.status !== statusFilter) return false
    if (categoryFilter !== 'all' && k.category !== categoryFilter) return false
    if (filter && !k.term.toLowerCase().includes(filter.toLowerCase()) &&
        !k.campaign.toLowerCase().includes(filter.toLowerCase())) return false
    return true
  })

  // Group filtered keywords by term (case-insensitive)
  const groups = useMemo(() => {
    const map = new Map<string, NegativeKeyword[]>()
    for (const kw of filtered) {
      const key = kw.term.toLowerCase()
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(kw)
    }
    // Sort groups: candidates first, then by total cost descending
    return [...map.entries()].sort((a, b) => {
      const aCandidates = a[1].some(k => k.status === 'candidate') ? 1 : 0
      const bCandidates = b[1].some(k => k.status === 'candidate') ? 1 : 0
      if (aCandidates !== bCandidates) return bCandidates - aCandidates
      const aCost = a[1].reduce((s, k) => s + k.cost, 0)
      const bCost = b[1].reduce((s, k) => s + k.cost, 0)
      return bCost - aCost
    })
  }, [filtered])

  const allCandidates = filtered.filter(k => k.status === 'candidate')
  const totalCost = filtered.reduce((sum, k) => sum + k.cost, 0)

  const toggleGroup = (ids: number[]) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      const allIn = ids.every(id => next.has(id))
      if (allIn) {
        ids.forEach(id => next.delete(id))
      } else {
        ids.forEach(id => next.add(id))
      }
      return next
    })
  }

  const selectAllCandidates = () => {
    const candidateIds = allCandidates.map(k => k.id)
    const allSelected = candidateIds.every(id => selectedIds.has(id))
    setSelectedIds(allSelected ? new Set() : new Set(candidateIds))
  }

  const handleGroupAction = async (ids: number[], newStatus: NegativeKeyword['status']) => {
    const logEntries: Parameters<typeof logBulkActions>[0] = []
    for (const id of ids) {
      const kw = keywords.find(k => k.id === id)
      if (!kw) continue
      const ok = await onUpdateStatus(id, newStatus)
      if (ok) {
        logEntries.push({
          action_type: ids.length > 1 ? `bulk_${newStatus}` : newStatus,
          keyword_id: id,
          term: kw.term,
          campaign: kw.campaign,
          previous_status: kw.status,
          new_status: newStatus,
          metadata: { match_type: kw.match_type, cost: kw.cost, clicks: kw.clicks },
        })
      }
    }
    if (logEntries.length > 0) await logBulkActions(logEntries)
  }

  const bulkAction = async (status: NegativeKeyword['status']) => {
    setBulkLoading(true)
    await handleGroupAction([...selectedIds], status)
    setSelectedIds(new Set())
    setBulkLoading(false)
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
          Negative Keywords
        </span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {groups.length} unique terms · {allCandidates.length} pending · ${totalCost.toLocaleString()} wasted
        </span>

        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as StatusFilter)}
          className="rounded-md px-3 py-1.5 text-xs outline-none"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}>
          <option value="all">All Statuses</option>
          <option value="candidate">Candidates</option>
          <option value="approved">Approved</option>
          <option value="denied">Denied</option>
        </select>

        {categories.length > 0 && (
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            className="rounded-md px-3 py-1.5 text-xs outline-none"
            style={{
              background: categoryFilter !== 'all' ? 'rgba(124,58,237,0.15)' : 'var(--surface-2)',
              border: categoryFilter !== 'all' ? '1px solid rgba(124,58,237,0.4)' : '1px solid var(--border)',
              color: categoryFilter !== 'all' ? '#A78BFA' : 'var(--text)',
            }}>
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat.replace(/_/g, ' ')}
                {` (${keywords.filter(k => k.category === cat).length})`}
              </option>
            ))}
          </select>
        )}

        <input type="text" placeholder="Filter..." value={filter}
          onChange={e => setFilter(e.target.value)}
          className="rounded-md px-3 py-1.5 text-xs outline-none"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }} />

        {allCandidates.length > 0 && (
          <button onClick={selectAllCandidates}
            className="rounded px-3 py-1.5 text-xs font-medium"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            {allCandidates.every(k => selectedIds.has(k.id)) ? 'Deselect All' : `Select All (${groups.length} terms)`}
          </button>
        )}

        <div className="ml-auto">
          <PushToAdsButton />
        </div>
      </div>

      {/* Grouped list */}
      <div className="flex flex-col gap-2">
        {groups.length === 0 ? (
          <div className="py-8 text-center text-sm" style={{ color: 'var(--text-dim)' }}>
            No negative keyword candidates
          </div>
        ) : (
          groups.map(([termKey, kwGroup]) => (
            <GroupedKeywordRow
              key={termKey}
              term={kwGroup[0].term}
              keywords={kwGroup}
              selectedIds={selectedIds}
              onToggleGroup={toggleGroup}
              onApproveGroup={ids => handleGroupAction(ids, 'approved')}
              onDenyGroup={ids => handleGroupAction(ids, 'denied')}
            />
          ))
        )}
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-xl px-5 py-3 shadow-lg"
          style={{ background: '#1e1e2e', border: '1px solid var(--border)' }}>
          <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
            {selectedIds.size} keyword{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <button onClick={() => bulkAction('approved')} disabled={bulkLoading}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
            style={{ background: '#22C55E' }}>
            {bulkLoading ? 'Processing...' : 'Approve All'}
          </button>
          <button onClick={() => bulkAction('denied')} disabled={bulkLoading}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
            style={{ background: '#EF4444' }}>
            Deny All
          </button>
          <button onClick={() => setSelectedIds(new Set())}
            className="rounded-lg px-3 py-2 text-xs font-medium"
            style={{ color: 'var(--text-muted)' }}>
            Clear
          </button>
        </div>
      )}
    </div>
  )
}

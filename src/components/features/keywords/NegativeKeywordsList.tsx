'use client'

import { useState } from 'react'
import { NegativeKeywordRow } from './NegativeKeywordRow'
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
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const { logAction, logBulkActions } = useKeywordActions()

  const filtered = keywords.filter(k => {
    if (statusFilter !== 'all' && k.status !== statusFilter) return false
    if (filter && !k.term.toLowerCase().includes(filter.toLowerCase()) &&
        !k.campaign.toLowerCase().includes(filter.toLowerCase())) return false
    return true
  })

  const candidates = filtered.filter(k => k.status === 'candidate')
  const totalCost = filtered.reduce((sum, k) => sum + k.cost, 0)

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectAllCandidates = () => {
    const candidateIds = candidates.map(k => k.id)
    const allSelected = candidateIds.every(id => selectedIds.has(id))
    setSelectedIds(allSelected ? new Set() : new Set(candidateIds))
  }

  const handleSingleAction = async (id: number, newStatus: NegativeKeyword['status']) => {
    const kw = keywords.find(k => k.id === id)
    if (!kw) return
    const ok = await onUpdateStatus(id, newStatus)
    if (ok) {
      await logAction({
        action_type: newStatus,
        keyword_id: id,
        term: kw.term,
        campaign: kw.campaign,
        previous_status: kw.status,
        new_status: newStatus,
        metadata: { match_type: kw.match_type, cost: kw.cost, clicks: kw.clicks },
      })
    }
  }

  const bulkAction = async (status: NegativeKeyword['status']) => {
    setBulkLoading(true)
    const ids = [...selectedIds]
    const logEntries: Parameters<typeof logBulkActions>[0] = []

    for (const id of ids) {
      const kw = keywords.find(k => k.id === id)
      if (!kw) continue
      const ok = await onUpdateStatus(id, status)
      if (ok) {
        logEntries.push({
          action_type: ids.length > 1 ? `bulk_${status}` : status,
          keyword_id: id,
          term: kw.term,
          campaign: kw.campaign,
          previous_status: kw.status,
          new_status: status,
          metadata: { match_type: kw.match_type, cost: kw.cost, clicks: kw.clicks },
        })
      }
    }

    if (logEntries.length > 0) {
      await logBulkActions(logEntries)
    }
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
          {candidates.length} pending · ${totalCost.toLocaleString()} wasted
        </span>

        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as StatusFilter)}
          className="rounded-md px-3 py-1.5 text-xs outline-none"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}>
          <option value="all">All Statuses</option>
          <option value="candidate">Candidates</option>
          <option value="approved">Approved</option>
          <option value="denied">Denied</option>
        </select>

        <input type="text" placeholder="Filter..." value={filter}
          onChange={e => setFilter(e.target.value)}
          className="rounded-md px-3 py-1.5 text-xs outline-none"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }} />

        {candidates.length > 0 && (
          <button onClick={selectAllCandidates}
            className="ml-auto rounded px-3 py-1.5 text-xs font-medium"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            {candidates.every(k => selectedIds.has(k.id)) ? 'Deselect All' : `Select All (${candidates.length})`}
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex flex-col gap-2">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-sm" style={{ color: 'var(--text-dim)' }}>
            No negative keyword candidates
          </div>
        ) : (
          filtered.map(kw => (
            <NegativeKeywordRow
              key={kw.id}
              keyword={kw}
              selected={selectedIds.has(kw.id)}
              onToggleSelect={() => toggleSelect(kw.id)}
              onApprove={id => handleSingleAction(id, 'approved')}
              onDeny={id => handleSingleAction(id, 'denied')}
            />
          ))
        )}
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-xl px-5 py-3 shadow-lg"
          style={{ background: '#1e1e2e', border: '1px solid var(--border)' }}>
          <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
            {selectedIds.size} selected
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

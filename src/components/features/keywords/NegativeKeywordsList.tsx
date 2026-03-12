'use client'

import { useState } from 'react'
import { NegativeKeywordRow } from './NegativeKeywordRow'
import type { NegativeKeyword } from '@/types'

interface NegativeKeywordsListProps {
  keywords: NegativeKeyword[]
  onUpdateStatus: (id: number, status: NegativeKeyword['status']) => Promise<boolean>
}

export function NegativeKeywordsList({ keywords, onUpdateStatus }: NegativeKeywordsListProps) {
  const [filter, setFilter] = useState('')

  const filtered = keywords.filter(k =>
    !filter || k.term.toLowerCase().includes(filter.toLowerCase()) ||
    k.campaign.toLowerCase().includes(filter.toLowerCase())
  )

  const candidates = filtered.filter(k => k.status === 'candidate').length
  const totalCost = filtered.reduce((sum, k) => sum + k.cost, 0)

  return (
    <div>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
            Negative Keywords
          </span>
          <span className="ml-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            {candidates} pending · ${totalCost.toLocaleString()} wasted
          </span>
        </div>
        <input
          type="text"
          placeholder="Filter..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="rounded-md px-3 py-1.5 text-xs outline-none"
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          }}
        />
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
              onApprove={id => onUpdateStatus(id, 'approved')}
              onDeny={id => onUpdateStatus(id, 'denied')}
            />
          ))
        )}
      </div>
    </div>
  )
}

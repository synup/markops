'use client'

import { useState } from 'react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { NegativeKeyword } from '@/types'

interface GroupedKeywordRowProps {
  term: string
  keywords: NegativeKeyword[]
  selectedIds: Set<number>
  onToggleGroup: (ids: number[]) => void
  onApproveGroup: (ids: number[]) => void
  onDenyGroup: (ids: number[]) => void
}

export function GroupedKeywordRow({
  term, keywords, selectedIds, onToggleGroup, onApproveGroup, onDenyGroup,
}: GroupedKeywordRowProps) {
  const [expanded, setExpanded] = useState(false)

  const ids = keywords.map(k => k.id)
  const candidates = keywords.filter(k => k.status === 'candidate')
  const candidateIds = candidates.map(k => k.id)
  const allSelected = candidateIds.length > 0 && candidateIds.every(id => selectedIds.has(id))
  const someSelected = candidateIds.some(id => selectedIds.has(id))
  const hasCandidates = candidates.length > 0

  // Aggregate metrics across all instances
  const totalClicks = keywords.reduce((s, k) => s + k.clicks, 0)
  const totalCost = keywords.reduce((s, k) => s + k.cost, 0)
  const totalConversions = keywords.reduce((s, k) => s + k.conversions, 0)

  // Determine dominant status
  const statuses = [...new Set(keywords.map(k => k.status))]
  const dominantStatus = statuses.length === 1 ? statuses[0] : null

  const campaigns = keywords.map(k => k.campaign)
  const matchType = keywords[0]?.match_type || 'exact'

  return (
    <div>
      <div
        className="flex items-center gap-4 rounded-lg px-4 py-3 transition-colors"
        style={{
          background: allSelected ? 'rgba(34,197,94,0.08)' : someSelected ? 'rgba(34,197,94,0.04)' : 'var(--surface)',
          border: allSelected ? '1px solid rgba(34,197,94,0.3)' : '1px solid var(--border)',
          opacity: dominantStatus === 'denied' ? 0.5 : 1,
          cursor: hasCandidates ? 'pointer' : 'default',
        }}
        onClick={hasCandidates ? () => onToggleGroup(candidateIds) : undefined}
      >
        {/* Checkbox for candidate groups */}
        {hasCandidates && (
          <input
            type="checkbox"
            checked={allSelected}
            ref={el => { if (el) el.indeterminate = someSelected && !allSelected }}
            onChange={() => onToggleGroup(candidateIds)}
            onClick={e => e.stopPropagation()}
            className="h-4 w-4 shrink-0 accent-green-500"
          />
        )}

        {/* Term info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium" style={{ color: 'var(--text)' }}>
              {term}
            </span>
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
              style={{ background: 'rgba(124,58,237,0.15)', color: '#A78BFA' }}
            >
              {keywords.length} campaign{keywords.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="truncate text-xs" style={{ color: 'var(--text-muted)' }}>
            {matchType}
            {keywords.length <= 3
              ? ` · ${campaigns.join(', ')}`
              : ` · ${campaigns.slice(0, 2).join(', ')} +${campaigns.length - 2} more`}
          </div>
        </div>

        {/* Aggregated metrics */}
        <div className="flex items-center gap-4 text-xs">
          <div className="text-center">
            <div style={{ color: 'var(--text-dim)' }}>Clicks</div>
            <div style={{ color: 'var(--text)' }}>{totalClicks}</div>
          </div>
          <div className="text-center">
            <div style={{ color: 'var(--text-dim)' }}>Cost</div>
            <div style={{ color: '#EF4444' }}>${totalCost.toFixed(0)}</div>
          </div>
          <div className="text-center">
            <div style={{ color: 'var(--text-dim)' }}>Conv</div>
            <div style={{ color: totalConversions > 0 ? '#22C55E' : 'var(--text-dim)' }}>
              {totalConversions}
            </div>
          </div>
        </div>

        {/* Status / Actions */}
        <div className="flex items-center gap-2">
          {!hasCandidates && dominantStatus ? (
            <StatusBadge status={dominantStatus} />
          ) : hasCandidates ? (
            <>
              <button
                onClick={e => { e.stopPropagation(); onApproveGroup(candidateIds) }}
                className="rounded px-3 py-1 text-xs font-medium transition-colors"
                style={{ background: 'rgba(34,197,94,0.15)', color: '#22C55E' }}>
                Approve
              </button>
              <button
                onClick={e => { e.stopPropagation(); onDenyGroup(candidateIds) }}
                className="rounded px-3 py-1 text-xs font-medium transition-colors"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
                Deny
              </button>
            </>
          ) : (
            <div className="flex gap-1">
              {statuses.map(s => <StatusBadge key={s} status={s} />)}
            </div>
          )}

          {/* Expand toggle */}
          <button
            onClick={e => { e.stopPropagation(); setExpanded(!expanded) }}
            className="ml-1 rounded p-1 text-xs transition-colors hover:bg-white/5"
            style={{ color: 'var(--text-muted)' }}
            title={expanded ? 'Collapse' : 'Show campaigns'}
          >
            {expanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Expanded campaign details */}
      {expanded && (
        <div className="ml-8 mt-1 flex flex-col gap-1">
          {keywords.map(kw => (
            <div key={kw.id} className="flex items-center gap-3 rounded px-3 py-2 text-xs"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <span className="min-w-0 flex-1 truncate" style={{ color: 'var(--text-muted)' }}>
                {kw.campaign}
              </span>
              <span style={{ color: 'var(--text-dim)' }}>{kw.clicks} clicks</span>
              <span style={{ color: '#EF4444' }}>${kw.cost.toFixed(0)}</span>
              <StatusBadge status={kw.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

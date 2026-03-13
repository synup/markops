'use client'

import { StatusBadge } from '@/components/ui/StatusBadge'
import type { NegativeKeyword } from '@/types'

interface NegativeKeywordRowProps {
  keyword: NegativeKeyword
  selected: boolean
  onToggleSelect: () => void
  onApprove: (id: number) => void
  onDeny: (id: number) => void
}

export function NegativeKeywordRow({ keyword, selected, onToggleSelect, onApprove, onDeny }: NegativeKeywordRowProps) {
  const isCandidate = keyword.status === 'candidate'

  return (
    <div
      className="flex items-center gap-4 rounded-lg px-4 py-3 transition-colors"
      style={{
        background: selected ? 'rgba(34,197,94,0.08)' : 'var(--surface)',
        border: selected ? '1px solid rgba(34,197,94,0.3)' : '1px solid var(--border)',
        opacity: keyword.status === 'denied' ? 0.5 : 1,
        cursor: isCandidate ? 'pointer' : 'default',
      }}
      onClick={isCandidate ? onToggleSelect : undefined}
    >
      {/* Checkbox for candidates */}
      {isCandidate && (
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          onClick={e => e.stopPropagation()}
          className="h-4 w-4 shrink-0 accent-green-500"
        />
      )}

      {/* Term info */}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium" style={{ color: 'var(--text)' }}>
          {keyword.term}
        </div>
        <div className="truncate text-xs" style={{ color: 'var(--text-muted)' }}>
          {keyword.campaign}
          {keyword.match_type && <span style={{ color: 'var(--text-dim)' }}> · {keyword.match_type}</span>}
          {keyword.category && <span style={{ color: 'var(--text-dim)' }}> · {keyword.category}</span>}
        </div>
      </div>

      {/* Metrics */}
      <div className="flex items-center gap-4 text-xs">
        <div className="text-center">
          <div style={{ color: 'var(--text-dim)' }}>Clicks</div>
          <div style={{ color: 'var(--text)' }}>{keyword.clicks}</div>
        </div>
        <div className="text-center">
          <div style={{ color: 'var(--text-dim)' }}>Cost</div>
          <div style={{ color: '#EF4444' }}>${keyword.cost.toFixed(0)}</div>
        </div>
        <div className="text-center">
          <div style={{ color: 'var(--text-dim)' }}>Conv</div>
          <div style={{ color: keyword.conversions > 0 ? '#22C55E' : 'var(--text-dim)' }}>
            {keyword.conversions}
          </div>
        </div>
      </div>

      {/* Status / Actions */}
      <div className="flex items-center gap-2">
        {!isCandidate ? (
          <StatusBadge status={keyword.status} />
        ) : (
          <>
            <button
              onClick={e => { e.stopPropagation(); onApprove(keyword.id) }}
              className="rounded px-3 py-1 text-xs font-medium transition-colors"
              style={{ background: 'rgba(34,197,94,0.15)', color: '#22C55E' }}>
              Approve
            </button>
            <button
              onClick={e => { e.stopPropagation(); onDeny(keyword.id) }}
              className="rounded px-3 py-1 text-xs font-medium transition-colors"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
              Deny
            </button>
          </>
        )}
      </div>
    </div>
  )
}

'use client'

import { StatusBadge } from '@/components/ui/StatusBadge'
import type { KeywordExpansion } from '@/types'

interface KeywordExpansionRowProps {
  keyword: KeywordExpansion
  onApprove: (id: number) => void
  onDeny: (id: number) => void
}

export function KeywordExpansionRow({ keyword, onApprove, onDeny }: KeywordExpansionRowProps) {
  const isDecided = keyword.status !== 'candidate'

  return (
    <div
      className="flex items-center gap-4 rounded-lg px-4 py-3"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        opacity: keyword.status === 'denied' ? 0.5 : 1,
      }}
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium" style={{ color: 'var(--text)' }}>
          {keyword.term}
        </div>
        <div className="truncate text-xs" style={{ color: 'var(--text-muted)' }}>
          {keyword.campaign}
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs">
        <div className="text-center">
          <div style={{ color: 'var(--text-dim)' }}>Clicks</div>
          <div style={{ color: 'var(--text)' }}>{keyword.clicks}</div>
        </div>
        <div className="text-center">
          <div style={{ color: 'var(--text-dim)' }}>Conv</div>
          <div style={{ color: 'var(--green)' }}>{keyword.conversions}</div>
        </div>
        <div className="text-center">
          <div style={{ color: 'var(--text-dim)' }}>CPA</div>
          <div style={{ color: keyword.cpa < 100 ? 'var(--green)' : 'var(--red)' }}>
            ${keyword.cpa.toFixed(0)}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isDecided ? (
          <StatusBadge status={keyword.status} />
        ) : (
          <>
            <button
              onClick={() => onApprove(keyword.id)}
              className="rounded px-3 py-1 text-xs font-medium"
              style={{ background: 'var(--green-muted)', color: 'var(--green)' }}
            >
              ✓ Add
            </button>
            <button
              onClick={() => onDeny(keyword.id)}
              className="rounded px-3 py-1 text-xs font-medium"
              style={{ background: 'var(--red-muted)', color: 'var(--red)' }}
            >
              ✗ Skip
            </button>
          </>
        )}
      </div>
    </div>
  )
}

'use client'

import { StatusBadge } from '@/components/ui/StatusBadge'
import type { NegativeKeyword } from '@/types'

interface NegativeKeywordRowProps {
  keyword: NegativeKeyword
  onApprove: (id: number) => void
  onDeny: (id: number) => void
}

export function NegativeKeywordRow({ keyword, onApprove, onDeny }: NegativeKeywordRowProps) {
  const isDecided = keyword.status !== 'candidate'

  return (
    <div
      className="flex items-center gap-4 rounded-lg px-4 py-3 transition-colors"
      style={{
        background: isDecided ? 'var(--surface)' : 'var(--surface)',
        border: '1px solid var(--border)',
        opacity: keyword.status === 'denied' ? 0.5 : 1,
      }}
    >
      {/* Term info */}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium" style={{ color: 'var(--text)' }}>
          {keyword.term}
        </div>
        <div className="truncate text-xs" style={{ color: 'var(--text-muted)' }}>
          {keyword.campaign} {keyword.category && `· ${keyword.category}`}
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
          <div style={{ color: 'var(--red)' }}>${keyword.cost.toFixed(0)}</div>
        </div>
        <div className="text-center">
          <div style={{ color: 'var(--text-dim)' }}>Conv</div>
          <div style={{ color: keyword.conversions > 0 ? 'var(--green)' : 'var(--text-dim)' }}>
            {keyword.conversions}
          </div>
        </div>
      </div>

      {/* Status / Actions */}
      <div className="flex items-center gap-2">
        {isDecided ? (
          <StatusBadge status={keyword.status} />
        ) : (
          <>
            <button
              onClick={() => onApprove(keyword.id)}
              className="rounded px-3 py-1 text-xs font-medium transition-colors"
              style={{ background: 'var(--green-muted)', color: 'var(--green)' }}
            >
              ✓ Block
            </button>
            <button
              onClick={() => onDeny(keyword.id)}
              className="rounded px-3 py-1 text-xs font-medium transition-colors"
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

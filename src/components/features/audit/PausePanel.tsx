'use client'

import { useKeywordsToPause } from '@/hooks/useAuditData'

export function PausePanel({ auditRunId }: { auditRunId: number }) {
  const { keywords, loading, updateStatus } = useKeywordsToPause(auditRunId)

  if (loading) return <div className="py-8 text-center text-sm" style={{ color: 'var(--text-dim)' }}>Loading...</div>

  return (
    <div className="flex flex-col gap-2">
      {keywords.map(kw => (
        <div key={kw.id} className="flex items-center gap-4 rounded-lg px-4 py-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex-1">
            <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>{kw.keyword}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{kw.campaign} · {kw.reason}</div>
          </div>
          <span className="text-xs" style={{ color: 'var(--red)' }}>${kw.spend} spent</span>
          <span className="text-xs" style={{ color: kw.quality_score && kw.quality_score <= 3 ? 'var(--red)' : 'var(--text-muted)' }}>
            QS {kw.quality_score}/10
          </span>
          {kw.status === 'candidate' ? (
            <>
              <button onClick={() => updateStatus(kw.id, 'approved')} className="rounded px-3 py-1 text-xs" style={{ background: 'var(--green-muted)', color: 'var(--green)' }}>⏸ Pause</button>
              <button onClick={() => updateStatus(kw.id, 'denied')} className="rounded px-3 py-1 text-xs" style={{ background: 'var(--red-muted)', color: 'var(--red)' }}>✗ Keep</button>
            </>
          ) : (
            <span className="text-xs" style={{ color: 'var(--text-dim)' }}>{kw.status}</span>
          )}
        </div>
      ))}
    </div>
  )
}

'use client'

import { useKeywordExpansions } from '@/hooks/useAuditData'

export function ExpansionPanel({ auditRunId }: { auditRunId: number }) {
  const { keywords, loading, updateStatus } = useKeywordExpansions(auditRunId)

  if (loading) return <div className="py-8 text-center text-sm" style={{ color: 'var(--text-dim)' }}>Loading...</div>

  return (
    <div className="flex flex-col gap-2">
      {keywords.map(kw => (
        <div key={kw.id} className="flex items-center gap-4 rounded-lg px-4 py-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex-1">
            <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>{kw.term}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{kw.campaign}</div>
          </div>
          <span className="text-xs" style={{ color: 'var(--green)' }}>{kw.conversions} conv</span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>CPA ${kw.cpa.toFixed(0)}</span>
          {kw.status === 'candidate' ? (
            <>
              <button onClick={() => updateStatus(kw.id, 'approved')} className="rounded px-3 py-1 text-xs" style={{ background: 'var(--green-muted)', color: 'var(--green)' }}>✓ Add</button>
              <button onClick={() => updateStatus(kw.id, 'denied')} className="rounded px-3 py-1 text-xs" style={{ background: 'var(--red-muted)', color: 'var(--red)' }}>✗ Skip</button>
            </>
          ) : (
            <span className="text-xs" style={{ color: 'var(--text-dim)' }}>{kw.status}</span>
          )}
        </div>
      ))}
    </div>
  )
}

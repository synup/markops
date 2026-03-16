'use client'

import { useResearchActivity } from '@/hooks/useRedditResearch'

export function ResearchActivityLog() {
  const { actions, loading } = useResearchActivity()

  if (loading) {
    return <div className="py-4 text-center text-sm" style={{ color: 'var(--text-dim)' }}>Loading activity...</div>
  }

  if (!actions.length) {
    return <div className="py-4 text-center text-sm" style={{ color: 'var(--text-dim)' }}>No research activity yet.</div>
  }

  return (
    <div>
      <div className="mb-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
        Recent Activity
      </div>
      <div className="flex flex-col gap-1">
        {actions.map(a => (
          <div
            key={a.id}
            className="flex items-center gap-3 rounded-lg px-3 py-2"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <span
              className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium"
              style={{
                background: a.action === 'approved' ? 'var(--green-muted)' : 'var(--red-muted)',
                color: a.action === 'approved' ? 'var(--green)' : 'var(--red)',
              }}
            >
              {a.action}
            </span>
            <span
              className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium"
              style={{
                background: a.type === 'tool' ? 'var(--brand-muted)' : 'rgba(59,130,246,0.12)',
                color: a.type === 'tool' ? 'var(--brand)' : 'var(--blue)',
              }}
            >
              {a.type}
            </span>
            <span className="min-w-0 flex-1 truncate text-xs" style={{ color: 'var(--text)' }}>
              {a.post_title}
            </span>
            <span className="shrink-0 text-[10px]" style={{ color: 'var(--text-dim)' }}>
              {new Date(a.acted_at).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

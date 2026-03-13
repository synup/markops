'use client'

import { useChangelog } from '@/hooks/useChangelog'

export function ChangelogPanel() {
  const { entries, pushHistory, loading } = useChangelog()

  if (loading) {
    return <div className="py-8 text-center text-sm" style={{ color: 'var(--text-dim)' }}>Loading changelog...</div>
  }

  const hasPushes = pushHistory.length > 0
  const hasEntries = entries.length > 0

  if (!hasPushes && !hasEntries) {
    return (
      <div className="py-8 text-center text-sm" style={{ color: 'var(--text-dim)' }}>
        No changes pushed to Google Ads yet. Approve keywords and push them to see history here.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Push history */}
      {hasPushes && (
        <div>
          <h3 className="mb-3 text-sm font-medium" style={{ color: 'var(--text)' }}>Push History</h3>
          <div className="flex flex-col gap-2">
            {pushHistory.map(p => (
              <PushRow key={p.id} push={p} />
            ))}
          </div>
        </div>
      )}

      {/* Individual change entries */}
      {hasEntries && (
        <div>
          <h3 className="mb-3 text-sm font-medium" style={{ color: 'var(--text)' }}>Change Details</h3>
          <div className="flex flex-col gap-1.5">
            {entries.map(e => (
              <ChangeRow key={e.id} entry={e} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PushRow({ push }: { push: { id: number; status: string; pushed_count: number; failed_count: number; created_at: string; completed_at: string | null; error_log: string | null } }) {
  const statusColor = push.status === 'completed' ? '#22C55E'
    : push.status === 'failed' ? '#EF4444'
    : push.status === 'processing' ? '#F59E0B'
    : 'var(--text-muted)'

  const date = new Date(push.created_at)
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="rounded-lg px-4 py-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
          style={{ background: `${statusColor}15`, color: statusColor }}>
          ↑
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>
            Push to Google Ads
          </div>
          <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
            <span>{push.pushed_count} pushed</span>
            {push.failed_count > 0 && <span style={{ color: '#EF4444' }}>{push.failed_count} failed</span>}
            <span>· {dateStr} {timeStr}</span>
          </div>
        </div>
        <span className="rounded px-2 py-0.5 text-[10px] font-semibold"
          style={{ background: `${statusColor}15`, color: statusColor }}>
          {push.status}
        </span>
      </div>
      {push.error_log && (
        <div className="mt-2 rounded px-3 py-1.5 text-[11px]"
          style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444' }}>
          {push.error_log}
        </div>
      )}
    </div>
  )
}

function ChangeRow({ entry }: { entry: { id: number; change_type: string; commit_message: string | null; pushed_at: string; details: Record<string, unknown> } }) {
  const date = new Date(entry.pushed_at)
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  const typeColor = entry.change_type === 'negative_keyword' ? '#EF4444'
    : entry.change_type === 'keyword_add' ? '#22C55E'
    : '#F59E0B'

  return (
    <div className="flex items-center gap-3 rounded-lg px-4 py-2"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: typeColor }} />
      <div className="min-w-0 flex-1">
        <span className="text-xs" style={{ color: 'var(--text)' }}>
          {entry.commit_message || entry.change_type}
        </span>
      </div>
      <span className="shrink-0 text-[10px]" style={{ color: 'var(--text-dim)' }}>{dateStr}</span>
    </div>
  )
}

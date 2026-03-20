'use client'

import { useJobHeartbeats } from '@/hooks/useErrorLogs'

const JOB_LABELS: Record<string, string> = {
  audit_poller: 'Audit Poller',
  push_to_ads: 'Push to Ads',
  campaign_metrics: 'Campaign Metrics',
  tally_leads: 'Tally Leads',
}

function minutesAgo(isoDate: string): number {
  return Math.round((Date.now() - new Date(isoDate).getTime()) / 60000)
}

function statusColor(status: string, mins: number): string {
  if (status === 'error') return 'var(--red)'
  if (mins > 15) return 'var(--yellow, #F59E0B)'
  return '#22C55E'
}

function formatLastSeen(iso: string): string {
  const mins = minutesAgo(iso)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function HeartbeatPanel() {
  const { heartbeats, loading } = useJobHeartbeats()

  if (loading) {
    return (
      <div className="rounded-lg p-4" style={{ background: 'var(--surface)' }}>
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading heartbeats...</div>
      </div>
    )
  }

  if (heartbeats.length === 0) {
    return (
      <div className="rounded-lg p-4" style={{ background: 'var(--surface)' }}>
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
          No heartbeats recorded yet. Heartbeats will appear after the next cron run.
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {heartbeats.map(hb => {
        const mins = minutesAgo(hb.last_seen_at)
        const color = statusColor(hb.status, mins)
        const label = JOB_LABELS[hb.job_name] || hb.job_name

        return (
          <div
            key={hb.id}
            className="flex flex-col gap-2 rounded-lg p-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
          >
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: color }}
              />
              <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                {label}
              </span>
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Last seen: {formatLastSeen(hb.last_seen_at)}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
              Runs: {hb.run_count.toLocaleString()}
            </div>
            {hb.last_error && (
              <div
                className="mt-1 truncate rounded px-2 py-1 text-xs"
                style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--red)' }}
                title={hb.last_error}
              >
                {hb.last_error}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

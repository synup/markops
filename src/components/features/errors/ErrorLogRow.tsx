'use client'

import { useState } from 'react'
import type { ErrorLog } from '@/types'

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'var(--red)',
  error: '#F59E0B',
  warning: 'var(--text-muted)',
}

const JOB_LABELS: Record<string, string> = {
  audit_poller: 'Audit Poller',
  push_to_ads: 'Push to Ads',
  campaign_metrics: 'Campaign Metrics',
  tally_leads: 'Tally Leads',
}

interface Props {
  log: ErrorLog
  onToggleResolved: (id: number, resolved: boolean) => void
}

export function ErrorLogRow({ log, onToggleResolved }: Props) {
  const [expanded, setExpanded] = useState(false)
  const color = SEVERITY_COLORS[log.severity] || 'var(--text-muted)'
  const jobLabel = JOB_LABELS[log.job_name] || log.job_name
  const date = new Date(log.created_at)
  const timeStr = date.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
  const hasDetails = Object.keys(log.details).length > 0

  return (
    <div
      className="rounded-lg p-3"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-subtle)',
        opacity: log.resolved ? 0.5 : 1,
      }}
    >
      <div className="flex items-start gap-3">
        {/* Severity dot */}
        <span
          className="mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: color }}
        />

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase"
              style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
            >
              {jobLabel}
            </span>
            <span
              className="text-[10px] uppercase"
              style={{ color }}
            >
              {log.severity}
            </span>
            <span className="ml-auto text-xs" style={{ color: 'var(--text-dim)' }}>
              {timeStr}
            </span>
          </div>

          <p className="mt-1 text-sm" style={{ color: 'var(--text)' }}>
            {log.message}
          </p>

          {/* Expandable details */}
          {hasDetails && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-1 text-xs"
              style={{ color: 'var(--brand)' }}
            >
              {expanded ? '▾ Hide details' : '▸ Show details'}
            </button>
          )}
          {expanded && hasDetails && (
            <pre
              className="mt-2 overflow-x-auto rounded p-2 text-xs"
              style={{ background: 'var(--bg)', color: 'var(--text-dim)' }}
            >
              {JSON.stringify(log.details, null, 2)}
            </pre>
          )}
        </div>

        {/* Resolve toggle */}
        <button
          onClick={() => onToggleResolved(log.id, !log.resolved)}
          className="shrink-0 rounded px-2 py-1 text-xs"
          style={{
            background: log.resolved ? '#22C55E22' : 'var(--surface-2)',
            color: log.resolved ? '#22C55E' : 'var(--text-muted)',
          }}
          title={log.resolved ? 'Mark unresolved' : 'Mark resolved'}
        >
          {log.resolved ? '✓ Resolved' : 'Resolve'}
        </button>
      </div>
    </div>
  )
}

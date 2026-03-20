'use client'

import { useState, useMemo } from 'react'
import { useErrorLogs } from '@/hooks/useErrorLogs'
import { ErrorLogRow } from './ErrorLogRow'

type SeverityFilter = 'all' | 'critical' | 'error' | 'warning'
type ResolvedFilter = 'all' | 'unresolved' | 'resolved'

export function ErrorLogList() {
  const { logs, loading, toggleResolved } = useErrorLogs()
  const [severity, setSeverity] = useState<SeverityFilter>('all')
  const [resolved, setResolved] = useState<ResolvedFilter>('unresolved')
  const [jobFilter, setJobFilter] = useState('all')

  const jobNames = useMemo(() => {
    const set = new Set(logs.map(l => l.job_name))
    return [...set].sort()
  }, [logs])

  const filtered = useMemo(() => {
    return logs.filter(l => {
      if (severity !== 'all' && l.severity !== severity) return false
      if (resolved === 'unresolved' && l.resolved) return false
      if (resolved === 'resolved' && !l.resolved) return false
      if (jobFilter !== 'all' && l.job_name !== jobFilter) return false
      return true
    })
  }, [logs, severity, resolved, jobFilter])

  if (loading) {
    return (
      <div className="py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        Loading error logs...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect
          value={severity}
          onChange={v => setSeverity(v as SeverityFilter)}
          options={[
            { value: 'all', label: 'All severities' },
            { value: 'critical', label: 'Critical' },
            { value: 'error', label: 'Error' },
            { value: 'warning', label: 'Warning' },
          ]}
        />
        <FilterSelect
          value={resolved}
          onChange={v => setResolved(v as ResolvedFilter)}
          options={[
            { value: 'unresolved', label: 'Unresolved' },
            { value: 'all', label: 'All' },
            { value: 'resolved', label: 'Resolved' },
          ]}
        />
        <FilterSelect
          value={jobFilter}
          onChange={setJobFilter}
          options={[
            { value: 'all', label: 'All jobs' },
            ...jobNames.map(j => ({ value: j, label: j.replace(/_/g, ' ') })),
          ]}
        />
        <span className="ml-auto text-xs" style={{ color: 'var(--text-dim)' }}>
          {filtered.length} of {logs.length} entries
        </span>
      </div>

      {/* Log rows */}
      {filtered.length === 0 ? (
        <div
          className="rounded-lg py-12 text-center text-sm"
          style={{ background: 'var(--surface)', color: 'var(--text-muted)' }}
        >
          {logs.length === 0
            ? 'No errors logged yet — all systems running clean.'
            : 'No errors match the current filters.'}
        </div>
      ) : (
        filtered.map(log => (
          <ErrorLogRow
            key={log.id}
            log={log}
            onToggleResolved={toggleResolved}
          />
        ))
      )}
    </div>
  )
}

/* ── Tiny filter select ──────────────────────────── */

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="rounded px-2 py-1 text-xs"
      style={{
        background: 'var(--surface-2)',
        color: 'var(--text)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

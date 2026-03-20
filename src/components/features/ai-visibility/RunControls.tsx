'use client'

import type { AIVisibilityRun } from '@/types'

interface RunControlsProps {
  latestRun: AIVisibilityRun | null
  runs: AIVisibilityRun[]
  selectedRunId: string | undefined
  onSelectRun: (id: string) => void
  onTriggerRun: () => void
  triggering: boolean
}

const FREQUENCIES = ['daily', '2x-week', 'weekly', 'manual'] as const

export function RunControls({
  latestRun,
  runs,
  selectedRunId,
  onSelectRun,
  onTriggerRun,
  triggering,
}: RunControlsProps) {
  const runDate = latestRun?.completed_at
    ? new Date(latestRun.completed_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : null

  const statusColor = {
    completed: '#22C55E',
    running: '#F59E0B',
    pending: 'var(--text-muted)',
    failed: 'var(--red)',
  }[latestRun?.status ?? 'pending']

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Last run status */}
      {latestRun && (
        <div className="flex items-center gap-2 text-xs">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: statusColor }}
          />
          <span style={{ color: 'var(--text-muted)' }}>
            {latestRun.status === 'completed' ? `Last run: ${runDate}` : latestRun.status}
          </span>
          {latestRun.total_keywords && (
            <span style={{ color: 'var(--text-dim)' }}>
              · {latestRun.total_keywords} keywords
            </span>
          )}
          {latestRun.estimated_cost != null && (
            <span style={{ color: 'var(--text-dim)' }}>
              · ${Number(latestRun.estimated_cost).toFixed(2)}
            </span>
          )}
        </div>
      )}

      {/* Run picker */}
      <select
        value={selectedRunId ?? latestRun?.id ?? ''}
        onChange={e => onSelectRun(e.target.value)}
        className="rounded px-2 py-1 text-xs"
        style={{
          background: 'var(--surface-2)',
          color: 'var(--text)',
          border: '1px solid var(--border)',
        }}
      >
        {runs.filter(r => r.status === 'completed').map(r => (
          <option key={r.id} value={r.id}>
            {new Date(r.completed_at ?? r.started_at ?? '').toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            })}
          </option>
        ))}
      </select>

      {/* Run Now button */}
      <button
        onClick={onTriggerRun}
        disabled={triggering || latestRun?.status === 'running'}
        className="rounded px-3 py-1.5 text-xs font-semibold text-white transition-opacity disabled:opacity-50"
        style={{ background: '#FF731E' }}
      >
        {triggering ? 'Starting...' : latestRun?.status === 'running' ? 'Running...' : 'Run Now'}
      </button>
    </div>
  )
}

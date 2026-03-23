'use client'

import type { PositionHistoryRow } from '@/hooks/useAIVisibility'

interface SynupRowHistoryProps {
  history: PositionHistoryRow[] | null
  loading: boolean
}

export function SynupRowHistory({ history, loading }: SynupRowHistoryProps) {
  if (loading) {
    return (
      <div className="px-6 py-4 text-xs" style={{ color: 'var(--text-dim)' }}>
        Loading history...
      </div>
    )
  }

  if (!history?.length) {
    return (
      <div className="px-6 py-4 text-xs" style={{ color: 'var(--text-dim)' }}>
        No historical data available.
      </div>
    )
  }

  return (
    <div className="px-6 py-3">
      <div className="mb-2 text-[10px] font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>
        Position History
      </div>
      <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['Run Date', 'Position', 'Change'].map(h => (
              <th
                key={h}
                className="px-3 py-1.5 text-left font-semibold"
                style={{ color: 'var(--text-muted)' }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {history.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <td className="px-3 py-1.5" style={{ color: 'var(--text)' }}>
                {row.run_date
                  ? new Date(row.run_date).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })
                  : '—'}
              </td>
              <td className="px-3 py-1.5" style={{ color: 'var(--text)' }}>
                {row.avg_position != null ? `#${row.avg_position}` : '—'}
              </td>
              <td className="px-3 py-1.5">
                <HistoryChange change={row.change} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function HistoryChange({ change }: { change: number | null }) {
  if (change == null) return <span style={{ color: 'var(--text-dim)' }}>—</span>
  if (change > 0) return <span style={{ color: '#22C55E' }}>▲ {change}</span>
  if (change < 0) return <span style={{ color: '#EF4444' }}>▼ {Math.abs(change)}</span>
  return <span style={{ color: 'var(--text-dim)' }}>—</span>
}

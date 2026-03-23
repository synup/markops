'use client'

import type { CompetitorSummary } from '@/types'
import { ExportCSVButton } from './ExportCSVButton'

interface CompetitorResultsTableProps {
  model: string
  summaries: CompetitorSummary[]
}

export function CompetitorResultsTable({ model, summaries }: CompetitorResultsTableProps) {
  const sorted = [...summaries].sort((a, b) => b.mention_rate - a.mention_rate)

  const csvHeaders = ['Competitor', 'Mention Rate', 'Avg Position', 'Change', 'Top URLs']
  const csvRows = sorted.map(c => [
    c.name,
    `${c.mention_rate}%`,
    c.avg_position != null ? String(c.avg_position) : '',
    c.position_change != null ? String(c.position_change) : '',
    c.top_urls.join(' | '),
  ])

  return (
    <div
      className="rounded-lg"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
          Competitor Mentions — {model}
        </span>
        {summaries.length > 0 && (
          <ExportCSVButton headers={csvHeaders} rows={csvRows} filename={`competitors-${model}`} />
        )}
      </div>

      {summaries.length === 0 ? (
        <div className="py-12 text-center text-sm" style={{ color: 'var(--text-dim)' }}>
          No competitor data for this model yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Competitor', 'Mention Rate', 'Avg Position', 'Change', 'Top Cited URLs'].map(h => (
                  <th
                    key={h}
                    className="px-3 py-2.5 text-left font-semibold"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map(comp => (
                <CompetitorRow key={comp.name} comp={comp} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function CompetitorRow({ comp }: { comp: CompetitorSummary }) {
  const rateColor = comp.mention_rate >= 60 ? '#22C55E'
    : comp.mention_rate >= 30 ? '#F59E0B'
    : 'var(--text-muted)'

  return (
    <tr
      className="transition-colors"
      style={{ borderBottom: '1px solid var(--border-subtle)' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <td className="px-3 py-2.5 font-medium" style={{ color: 'var(--text)' }}>
        {comp.name}
      </td>
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div
            className="h-1.5 rounded-full"
            style={{
              width: `${Math.max(comp.mention_rate, 4)}%`,
              maxWidth: '80px',
              background: rateColor,
            }}
          />
          <span style={{ color: rateColor }}>{comp.mention_rate}%</span>
        </div>
      </td>
      <td className="px-3 py-2.5" style={{ color: 'var(--text)' }}>
        {comp.avg_position != null ? `#${comp.avg_position}` : '—'}
      </td>
      <td className="px-3 py-2.5">
        <ChangeIndicator change={comp.position_change} />
      </td>
      <td className="max-w-[200px] truncate px-3 py-2.5">
        {comp.top_urls.length > 0 ? (
          comp.top_urls.slice(0, 2).map((url, i) => (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="mr-1 text-[10px] hover:underline"
              style={{ color: '#00AEEF' }}
            >
              {url.replace('https://', '').split('/').slice(0, 2).join('/')}
            </a>
          ))
        ) : (
          <span style={{ color: 'var(--text-dim)' }}>—</span>
        )}
      </td>
    </tr>
  )
}

function ChangeIndicator({ change }: { change: number | null }) {
  if (change == null) {
    return <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>NEW</span>
  }
  if (change > 0) {
    return <span className="text-[10px] font-semibold" style={{ color: '#22C55E' }}>▲ {change}</span>
  }
  if (change < 0) {
    return <span className="text-[10px] font-semibold" style={{ color: '#EF4444' }}>▼ {Math.abs(change)}</span>
  }
  return <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>—</span>
}

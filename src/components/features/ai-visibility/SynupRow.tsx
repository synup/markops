'use client'

import { useState } from 'react'
import type { SynupKeywordSummary } from '@/types'
import type { PositionHistoryRow } from '@/hooks/useAIVisibility'
import { SynupRowHistory } from './SynupRowHistory'

const CATEGORY_COLORS: Record<string, string> = {
  competitive: '#F59E0B',
  'listing management': '#3B82F6',
  reputation: '#8B5CF6',
  'local SEO': '#22C55E',
  'social/pages': '#EC4899',
}

interface SynupRowProps {
  row: SynupKeywordSummary
  model: string
  onFetchHistory: (keywordId: string, model: string) => Promise<PositionHistoryRow[]>
}

export function SynupRow({ row, model, onFetchHistory }: SynupRowProps) {
  const [expanded, setExpanded] = useState(false)
  const [history, setHistory] = useState<PositionHistoryRow[] | null>(null)
  const [histLoading, setHistLoading] = useState(false)
  const catColor = CATEGORY_COLORS[row.category] ?? 'var(--text-muted)'

  const handleClick = async () => {
    if (expanded) { setExpanded(false); return }
    setExpanded(true)
    if (!history) {
      setHistLoading(true)
      const data = await onFetchHistory(row.keyword_id, model)
      setHistory(data)
      setHistLoading(false)
    }
  }

  return (
    <>
      <tr
        className="cursor-pointer transition-colors"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
        onClick={handleClick}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <td className="px-3 py-2.5 font-medium" style={{ color: 'var(--text)' }}>
          <span className="mr-1 text-[10px]" style={{ color: 'var(--text-dim)' }}>
            {expanded ? '▾' : '▸'}
          </span>
          {row.keyword_text}
        </td>
        <td className="px-3 py-2.5">
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{ background: `${catColor}22`, color: catColor }}
          >
            {row.category}
          </span>
        </td>
        <td className="px-3 py-2.5">
          <span
            className="rounded px-2 py-0.5 text-[10px] font-semibold"
            style={{
              background: row.mentioned ? '#22C55E22' : '#EF444422',
              color: row.mentioned ? '#22C55E' : '#EF4444',
            }}
          >
            {row.mentioned ? 'YES' : 'NO'}
          </span>
        </td>
        <td className="px-3 py-2.5" style={{ color: 'var(--text)' }}>
          {row.avg_position != null ? `#${row.avg_position}` : '—'}
        </td>
        <td className="px-3 py-2.5">
          <ChangeIndicator change={row.position_change} />
        </td>
        <td className="max-w-[200px] truncate px-3 py-2.5">
          {row.cited_urls.length > 0 ? (
            row.cited_urls.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="mr-1 text-[10px] hover:underline"
                style={{ color: '#00AEEF' }}
                onClick={e => e.stopPropagation()}
              >
                {url.replace('https://', '').split('/').slice(0, 2).join('/')}
              </a>
            ))
          ) : (
            <span style={{ color: 'var(--text-dim)' }}>—</span>
          )}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={6} style={{ background: 'var(--surface-2)', padding: 0 }}>
            <SynupRowHistory history={history} loading={histLoading} />
          </td>
        </tr>
      )}
    </>
  )
}

export function ChangeIndicator({ change }: { change: number | null }) {
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

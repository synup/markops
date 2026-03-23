'use client'

import { useState } from 'react'
import type { SynupKeywordSummary } from '@/types'
import type { PositionHistoryRow } from '@/hooks/useAIVisibility'
import { SynupRow } from './SynupRow'
import { ExportCSVButton } from './ExportCSVButton'

interface SynupResultsTableProps {
  model: string
  summaries: SynupKeywordSummary[]
  onFetchHistory: (keywordId: string, model: string) => Promise<PositionHistoryRow[]>
}

type SortKey = 'keyword_text' | 'avg_position' | 'mentioned'

export function SynupResultsTable({ model, summaries, onFetchHistory }: SynupResultsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('avg_position')
  const [sortAsc, setSortAsc] = useState(true)

  const sorted = [...summaries].sort((a, b) => {
    const dir = sortAsc ? 1 : -1
    if (sortKey === 'mentioned') {
      return ((a.mentioned ? 0 : 1) - (b.mentioned ? 0 : 1)) * dir
    }
    if (sortKey === 'avg_position') {
      return ((a.avg_position ?? 999) - (b.avg_position ?? 999)) * dir
    }
    return a.keyword_text.localeCompare(b.keyword_text) * dir
  })

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(true) }
  }

  const arrow = (key: SortKey) => sortKey === key ? (sortAsc ? ' ▴' : ' ▾') : ''

  const csvHeaders = ['Keyword', 'Category', 'Mentioned', 'Avg Position', 'Change', 'Cited URLs']
  const csvRows = sorted.map(r => [
    r.keyword_text,
    r.category,
    r.mentioned ? 'YES' : 'NO',
    r.avg_position != null ? String(r.avg_position) : '',
    r.position_change != null ? String(r.position_change) : '',
    r.cited_urls.join(' | '),
  ])

  return (
    <div
      className="rounded-lg"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
          Synup Mentions — {model}
        </span>
        {summaries.length > 0 && (
          <ExportCSVButton headers={csvHeaders} rows={csvRows} filename={`synup-${model}`} />
        )}
      </div>

      {summaries.length === 0 ? (
        <div className="py-12 text-center text-sm" style={{ color: 'var(--text-dim)' }}>
          No results for this model yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <Th onClick={() => handleSort('keyword_text')}>Query{arrow('keyword_text')}</Th>
                <th className="px-3 py-2.5 text-left font-semibold" style={{ color: 'var(--text-muted)' }}>Category</th>
                <Th onClick={() => handleSort('mentioned')}>Mentioned{arrow('mentioned')}</Th>
                <Th onClick={() => handleSort('avg_position')}>Avg Position{arrow('avg_position')}</Th>
                <th className="px-3 py-2.5 text-left font-semibold" style={{ color: 'var(--text-muted)' }}>Change</th>
                <th className="px-3 py-2.5 text-left font-semibold" style={{ color: 'var(--text-muted)' }}>Cited URLs</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(row => (
                <SynupRow
                  key={row.keyword_id}
                  row={row}
                  model={model}
                  onFetchHistory={onFetchHistory}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Th({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <th
      className="cursor-pointer select-none px-3 py-2.5 text-left font-semibold"
      style={{ color: 'var(--text-muted)' }}
      onClick={onClick}
    >
      {children}
    </th>
  )
}

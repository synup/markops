import type { PseoArticle, PseoColumnFilters } from '@/types'

interface ColumnDef {
  key: keyof PseoArticle
  label: string
  type: 'dropdown' | 'text'
}

interface PseoFilterRowProps {
  columns: ColumnDef[]
  columnFilters: PseoColumnFilters
  updateFilter: (field: keyof PseoArticle, value: string) => void
  filterOptions: Record<string, string[]>
}

export function PseoFilterRow({ columns, columnFilters, updateFilter, filterOptions }: PseoFilterRowProps) {
  return (
    <tr style={{ background: 'var(--surface-2)' }}>
      {columns.map(col => (
        <td key={col.key} className="px-2 py-1.5">
          {col.type === 'dropdown' ? (
            <select
              value={columnFilters[col.key] || ''}
              onChange={e => updateFilter(col.key, e.target.value)}
              className="w-full rounded px-2 py-1 text-xs outline-none"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: columnFilters[col.key] ? 'var(--text)' : 'var(--text-dim)',
              }}
            >
              <option value="">All</option>
              {(filterOptions[col.key] || []).map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={columnFilters[col.key] || ''}
              onChange={e => updateFilter(col.key, e.target.value)}
              placeholder="Filter..."
              className="w-full rounded px-2 py-1 text-xs outline-none"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
            />
          )}
        </td>
      ))}
    </tr>
  )
}

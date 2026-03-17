import type { PseoSortConfig, PseoSortField } from '@/types'

interface PseoTableHeaderProps {
  column: { key: PseoSortField; label: string }
  sort: PseoSortConfig
  onSort: (field: PseoSortField) => void
}

export function PseoTableHeader({ column, sort, onSort }: PseoTableHeaderProps) {
  const isActive = sort.field === column.key
  const arrow = isActive ? (sort.direction === 'asc' ? ' ↑' : ' ↓') : ''

  return (
    <th
      className="cursor-pointer select-none whitespace-nowrap px-3 py-2 text-left text-xs font-medium"
      style={{ color: isActive ? 'var(--text)' : 'var(--text-muted)' }}
      onClick={() => onSort(column.key)}
    >
      {column.label}{arrow}
    </th>
  )
}

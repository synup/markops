import type { PseoArticle, PseoSortConfig, PseoSortField, PseoColumnFilters } from '@/types'
import { PseoTableHeader } from './PseoTableHeader'
import { PseoTableRow } from './PseoTableRow'
import { PseoFilterRow } from './PseoFilterRow'
import { PseoPagination } from './PseoPagination'

interface ColumnDef {
  key: PseoSortField
  label: string
  type: 'dropdown' | 'text'
  expanded?: boolean
}

const ALL_COLUMNS: ColumnDef[] = [
  { key: 'site', label: 'Site', type: 'dropdown' },
  { key: 'contentType', label: 'Content Type', type: 'dropdown' },
  { key: 'title', label: 'Title', type: 'text' },
  { key: 'slug', label: 'Slug', type: 'text' },
  { key: 'fullUrl', label: 'Full URL', type: 'text' },
  { key: 'targetKeyword', label: 'Target Keyword', type: 'text' },
  { key: 'category', label: 'Category', type: 'dropdown' },
  { key: 'toolsList', label: 'Tools List', type: 'text' },
  { key: 'publishedDate', label: 'Published Date', type: 'text' },
  { key: 'indexerStatus', label: 'Indexer Status', type: 'dropdown' },
  // Expanded columns
  { key: 'toolCount', label: 'Tool Count', type: 'text', expanded: true },
  { key: 'indexerResponseCode', label: 'Response Code', type: 'text', expanded: true },
  { key: 'timestamp', label: 'Timestamp', type: 'text', expanded: true },
]

interface PseoDataTableProps {
  articles: PseoArticle[]
  totalFiltered: number
  loading: boolean
  expanded: boolean
  setExpanded: (v: boolean) => void
  columnFilters: PseoColumnFilters
  updateFilter: (field: keyof PseoArticle, value: string) => void
  clearAllFilters: () => void
  hasActiveFilters: boolean
  filterOptions: Record<string, string[]>
  sort: PseoSortConfig
  toggleSort: (field: PseoSortField) => void
  page: number
  setPage: (p: number) => void
  totalPages: number
}

export function PseoDataTable({
  articles, totalFiltered, loading, expanded, setExpanded,
  columnFilters, updateFilter, clearAllFilters, hasActiveFilters, filterOptions,
  sort, toggleSort, page, setPage, totalPages,
}: PseoDataTableProps) {
  const visibleColumns = ALL_COLUMNS.filter(c => !c.expanded || expanded)

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded" style={{ background: 'var(--surface)' }} />
        ))}
      </div>
    )
  }

  return (
    <div>
      {/* Toolbar: count + expand toggle + clear filters */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {totalFiltered} article{totalFiltered !== 1 ? 's' : ''}
          </span>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-xs font-medium"
              style={{ color: 'var(--brand)' }}
            >
              Clear filters
            </button>
          )}
        </div>
        <label className="flex cursor-pointer items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Expand Columns</span>
          <div
            className="relative h-5 w-9 rounded-full transition-colors"
            style={{ background: expanded ? 'var(--brand)' : 'var(--surface-3)' }}
            onClick={() => setExpanded(!expanded)}
          >
            <div
              className="absolute top-0.5 h-4 w-4 rounded-full transition-transform"
              style={{
                background: '#fff',
                left: expanded ? '18px' : '2px',
              }}
            />
          </div>
        </label>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--surface)' }}>
              {visibleColumns.map(col => (
                <PseoTableHeader key={col.key} column={col} sort={sort} onSort={toggleSort} />
              ))}
            </tr>
            <PseoFilterRow
              columns={visibleColumns}
              columnFilters={columnFilters}
              updateFilter={updateFilter}
              filterOptions={filterOptions}
            />
          </thead>
          <tbody>
            {articles.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length} className="py-8 text-center" style={{ color: 'var(--text-muted)' }}>
                  No articles match the current filters
                </td>
              </tr>
            ) : (
              articles.map((article, idx) => (
                <PseoTableRow key={`${article.slug}-${idx}`} article={article} expanded={expanded} />
              ))
            )}
          </tbody>
        </table>
      </div>

      <PseoPagination page={page} totalPages={totalPages} setPage={setPage} />
    </div>
  )
}

'use client'

import { Topbar } from '@/components/layout/Topbar'
import { PseoAnalyticsBar } from '@/components/features/pseo-content/PseoAnalyticsBar'
import { PseoDataTable } from '@/components/features/pseo-content/PseoDataTable'
import { usePseoContent } from '@/hooks/usePseoContent'

export default function PseoContentPage() {
  const {
    articles, totalFiltered, analytics, perSiteCounts, loading, error,
    dateRange, setDateRange, customRange, setCustomRange,
    columnFilters, updateColumnFilter, clearAllFilters, hasActiveFilters, filterOptions,
    sort, toggleSort,
    page, setPage, totalPages,
    expandedColumns, setExpandedColumns,
  } = usePseoContent()

  return (
    <>
      <Topbar title="pSEO Content" subtitle="Programmatic SEO Article Tracker" />
      <div className="p-6">
        {error ? (
          <div className="py-12 text-center text-sm" style={{ color: 'var(--red)' }}>
            {error}
          </div>
        ) : (
          <>
            <PseoAnalyticsBar
              analytics={analytics}
              perSiteCounts={perSiteCounts}
              dateRange={dateRange}
              setDateRange={setDateRange}
              customRange={customRange}
              setCustomRange={setCustomRange}
              loading={loading}
            />
            <PseoDataTable
              articles={articles}
              totalFiltered={totalFiltered}
              loading={loading}
              expanded={expandedColumns}
              setExpanded={setExpandedColumns}
              columnFilters={columnFilters}
              updateFilter={updateColumnFilter}
              clearAllFilters={clearAllFilters}
              hasActiveFilters={hasActiveFilters}
              filterOptions={filterOptions}
              sort={sort}
              toggleSort={toggleSort}
              page={page}
              setPage={setPage}
              totalPages={totalPages}
            />
          </>
        )}
      </div>
    </>
  )
}

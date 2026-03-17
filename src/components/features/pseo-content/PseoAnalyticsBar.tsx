import { StatCard } from '@/components/ui/StatCard'
import type { PseoAnalytics, PseoDateRange } from '@/types'

const DATE_OPTIONS: { value: PseoDateRange; label: string }[] = [
  { value: '7d', label: '7 days' },
  { value: '14d', label: '14 days' },
  { value: '1m', label: '1 month' },
  { value: '3m', label: '3 months' },
]

interface PseoAnalyticsBarProps {
  analytics: PseoAnalytics
  dateRange: PseoDateRange
  setDateRange: (range: PseoDateRange) => void
  loading: boolean
}

export function PseoAnalyticsBar({ analytics, dateRange, setDateRange, loading }: PseoAnalyticsBarProps) {
  if (loading) {
    return (
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-lg p-4" style={{ background: 'var(--surface)' }}>
            <div className="h-4 w-20 rounded" style={{ background: 'var(--border)' }} />
            <div className="mt-2 h-8 w-16 rounded" style={{ background: 'var(--border)' }} />
          </div>
        ))}
      </div>
    )
  }

  const rateColor =
    analytics.indexingSuccessRate >= 90 ? 'var(--green)' :
    analytics.indexingSuccessRate >= 70 ? 'var(--yellow)' : 'var(--red)'

  return (
    <div className="mb-6 flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total Articles" value={analytics.totalArticles} />
        <StatCard label="Last 7 Days" value={analytics.articlesLast7Days} />
        <StatCard
          label="Indexing Rate"
          value={`${analytics.indexingSuccessRate.toFixed(1)}%`}
          color={rateColor}
        />
        {/* Date range picker */}
        <div className="rounded-lg p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Time Range</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {DATE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setDateRange(opt.value)}
                className="rounded px-2.5 py-1 text-xs font-medium transition-colors"
                style={{
                  background: dateRange === opt.value ? 'var(--brand)' : 'var(--surface-2)',
                  color: dateRange === opt.value ? '#fff' : 'var(--text-muted)',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import type { PseoAnalytics, PseoDateRange } from '@/types'

const DATE_OPTIONS: { value: PseoDateRange; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '14d', label: 'Last 14 days' },
  { value: '1m', label: 'Last 1 month' },
  { value: 'all', label: 'All Time' },
]

interface PseoAnalyticsBarProps {
  analytics: PseoAnalytics
  perSiteCounts: [string, number][]
  dateRange: PseoDateRange
  setDateRange: (range: PseoDateRange) => void
  loading: boolean
}

export function PseoAnalyticsBar({ analytics, perSiteCounts, dateRange, setDateRange, loading }: PseoAnalyticsBarProps) {
  const [datePickerOpen, setDatePickerOpen] = useState(false)

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

  const currentLabel = DATE_OPTIONS.find(o => o.value === dateRange)?.label ?? ''

  return (
    <div className="mb-6 flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {/* Per Site card */}
        <div
          className="pseo-card-hover rounded-lg p-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Per Site</div>
          <div className="mt-2 flex flex-col gap-1">
            {perSiteCounts.length === 0 ? (
              <span className="text-sm" style={{ color: 'var(--text-dim)' }}>No data</span>
            ) : (
              perSiteCounts.map(([site, count]) => (
                <div key={site} className="flex items-center justify-between text-xs">
                  <span style={{ color: 'var(--text)' }}>{site}</span>
                  <span className="font-semibold" style={{ color: 'var(--text)' }}>
                    {count} article{count !== 1 ? 's' : ''}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div
          className="pseo-card-hover rounded-lg p-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Last 7 Days</div>
          <div className="mt-1 text-2xl font-bold" style={{ color: 'var(--text)' }}>{analytics.articlesLast7Days}</div>
        </div>

        <div
          className="pseo-card-hover rounded-lg p-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Indexing Rate</div>
          <div className="mt-1 text-2xl font-bold" style={{ color: rateColor }}>
            {analytics.indexingSuccessRate.toFixed(1)}%
          </div>
        </div>

        {/* Date range picker — GSC style */}
        <div className="relative">
          <div
            className="pseo-card-hover cursor-pointer rounded-lg p-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            onClick={() => setDatePickerOpen(!datePickerOpen)}
          >
            <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Date Range</div>
            <div className="mt-1 text-lg font-bold" style={{ color: 'var(--text)' }}>{currentLabel}</div>
            <div className="mt-0.5 text-xs" style={{ color: 'var(--text-dim)' }}>Click to change</div>
          </div>

          {datePickerOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDatePickerOpen(false)} />
              <div
                className="absolute right-0 top-full z-20 mt-2 w-56 rounded-lg p-4 shadow-lg"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div className="mb-3 text-sm font-semibold" style={{ color: 'var(--text)' }}>Date range</div>
                <div className="flex flex-col gap-2">
                  {DATE_OPTIONS.map(opt => (
                    <label
                      key={opt.value}
                      className="flex cursor-pointer items-center gap-3 rounded px-2 py-1.5 transition-colors"
                      style={{ background: dateRange === opt.value ? 'var(--surface-2)' : 'transparent' }}
                      onClick={() => { setDateRange(opt.value); setDatePickerOpen(false) }}
                    >
                      <span
                        className="flex h-4 w-4 items-center justify-center rounded-full"
                        style={{ border: `2px solid ${dateRange === opt.value ? 'var(--brand)' : 'var(--text-dim)'}` }}
                      >
                        {dateRange === opt.value && (
                          <span className="h-2 w-2 rounded-full" style={{ background: 'var(--brand)' }} />
                        )}
                      </span>
                      <span className="text-sm" style={{ color: 'var(--text)' }}>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

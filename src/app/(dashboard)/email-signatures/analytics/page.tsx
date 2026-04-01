'use client'

import { useState, useMemo } from 'react'
import { AnalyticsMetrics } from '@/components/email-signatures/analytics/AnalyticsMetrics'
import { AnalyticsChart } from '@/components/email-signatures/analytics/AnalyticsChart'
import { DateRangePicker } from '@/components/email-signatures/analytics/DateRangePicker'
import { DeployHistoryTable } from '@/components/email-signatures/analytics/DeployHistoryTable'

function generateMockData(days: number) {
  const data = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    data.push({
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      views: Math.floor(Math.random() * 200 + 50),
      clicks: Math.floor(Math.random() * 40 + 5),
    })
  }
  return data
}

const RANGE_DAYS: Record<string, number> = { '7d': 7, '14d': 14, '30d': 30, '90d': 90 }

export default function AnalyticsPage() {
  const [range, setRange] = useState('30d')
  const data = useMemo(() => generateMockData(RANGE_DAYS[range]), [range])
  const totalViews = data.reduce((s, d) => s + d.views, 0)
  const totalClicks = data.reduce((s, d) => s + d.clicks, 0)

  // Downsample for chart readability
  const chartData = data.length > 15
    ? data.filter((_, i) => i % Math.ceil(data.length / 15) === 0)
    : data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Analytics</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Signature performance and deployment history.
          </p>
        </div>
        <DateRangePicker range={range} onRangeChange={setRange} />
      </div>

      <AnalyticsMetrics views={totalViews} clicks={totalClicks} />
      <AnalyticsChart data={chartData} />

      <div>
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>Deploy History</h2>
        <DeployHistoryTable />
      </div>
    </div>
  )
}

'use client'

import { useLeadsSummary } from '@/hooks/leads'
import { StatCard } from '@/components/ui/StatCard'
import Link from 'next/link'

export function LeadsSummaryCard() {
  const { summary, loading } = useLeadsSummary(7)

  if (loading) {
    return (
      <div className="mt-6">
        <h3 className="mb-3 text-sm font-semibold" style={{ color: 'var(--text)' }}>
          Leads Summary
        </h3>
        <div className="py-6 text-center text-sm" style={{ color: 'var(--text-dim)' }}>
          Loading leads data...
        </div>
      </div>
    )
  }

  const { yesterday, period, dailyCounts, topSources } = summary

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
          Leads Summary
        </h3>
        <Link
          href="/leads"
          className="text-xs font-medium transition-opacity hover:opacity-70"
          style={{ color: 'var(--brand)' }}
        >
          View all leads →
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <StatCard
          label="Yesterday"
          value={yesterday.total}
          subtext={`${yesterday.book_a_demo} demo · ${yesterday.contact_us} contact`}
        />
        <StatCard
          label="Last 7 Days"
          value={period.total}
          subtext={`${period.book_a_demo} demo · ${period.contact_us} contact`}
        />
        <StatCard
          label="Book a Demo (7d)"
          value={period.book_a_demo}
          color="var(--brand)"
        />
        <StatCard
          label="Contact Us (7d)"
          value={period.contact_us}
          color="var(--green)"
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <DailyTrendChart dailyCounts={dailyCounts} />
        <TopSourcesList topSources={topSources} />
      </div>
    </div>
  )
}

function DailyTrendChart({ dailyCounts }: { dailyCounts: { date: string; total: number; book_a_demo: number; contact_us: number }[] }) {
  return (
    <div
      className="rounded-lg p-4"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="mb-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
        Daily trend (7 days)
      </div>
      <div className="flex items-end gap-1" style={{ height: 48 }}>
        {dailyCounts.length === 0 ? (
          <div className="text-xs" style={{ color: 'var(--text-dim)' }}>No data yet</div>
        ) : (
          dailyCounts.slice(-7).map((d) => {
            const max = Math.max(...dailyCounts.slice(-7).map(x => x.total), 1)
            const height = Math.max((d.total / max) * 44, 2)
            return (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-0.5">
                <div className="flex w-full gap-px" style={{ height }}>
                  <div
                    className="flex-1 rounded-sm"
                    style={{
                      background: 'var(--brand)',
                      height: `${Math.max((d.book_a_demo / Math.max(d.total, 1)) * 100, 0)}%`,
                      minHeight: d.book_a_demo > 0 ? 2 : 0,
                      alignSelf: 'flex-end',
                    }}
                  />
                  <div
                    className="flex-1 rounded-sm"
                    style={{
                      background: 'var(--green)',
                      height: `${Math.max((d.contact_us / Math.max(d.total, 1)) * 100, 0)}%`,
                      minHeight: d.contact_us > 0 ? 2 : 0,
                      alignSelf: 'flex-end',
                    }}
                  />
                </div>
                <div className="text-[9px]" style={{ color: 'var(--text-dim)' }}>
                  {new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'narrow' })}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function TopSourcesList({ topSources }: { topSources: { source: string; count: number }[] }) {
  return (
    <div
      className="rounded-lg p-4"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="mb-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
        Top sources (7 days)
      </div>
      {topSources.length === 0 ? (
        <div className="text-xs" style={{ color: 'var(--text-dim)' }}>No attribution data yet</div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {topSources.slice(0, 4).map((s) => (
            <div key={s.source} className="flex items-center justify-between">
              <span className="truncate text-xs" style={{ color: 'var(--text)', maxWidth: '70%' }}>
                {s.source}
              </span>
              <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                {s.count}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

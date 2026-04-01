import { Eye, MousePointerClick, Percent } from 'lucide-react'

interface AnalyticsMetricsProps {
  views: number
  clicks: number
}

export function AnalyticsMetrics({ views, clicks }: AnalyticsMetricsProps) {
  const ctr = views > 0 ? ((clicks / views) * 100).toFixed(1) : '0.0'

  const cards = [
    { label: 'Total Views', value: views.toLocaleString(), icon: Eye, color: 'var(--brand)' },
    { label: 'Total Clicks', value: clicks.toLocaleString(), icon: MousePointerClick, color: 'var(--green)' },
    { label: 'CTR', value: `${ctr}%`, icon: Percent, color: 'var(--yellow)' },
  ]

  return (
    <div className="grid grid-cols-3 gap-4">
      {cards.map(c => {
        const Icon = c.icon
        return (
          <div key={c.label} className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `color-mix(in srgb, ${c.color} 15%, transparent)` }}>
                <Icon className="w-5 h-5" style={{ color: c.color }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{c.value}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.label}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

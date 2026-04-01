'use client'

interface DataPoint {
  label: string
  views: number
  clicks: number
}

interface AnalyticsChartProps {
  data: DataPoint[]
}

export function AnalyticsChart({ data }: AnalyticsChartProps) {
  const maxVal = Math.max(...data.map(d => d.views), 1)
  const chartHeight = 200

  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ background: 'var(--brand)' }} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Views</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ background: 'var(--green)' }} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Clicks</span>
        </div>
      </div>

      {/* SVG line chart */}
      <div className="relative" style={{ height: chartHeight }}>
        <svg width="100%" height={chartHeight} viewBox={`0 0 ${data.length * 80} ${chartHeight}`} preserveAspectRatio="none" className="overflow-visible">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(pct => (
            <line key={pct} x1="0" y1={chartHeight - pct * chartHeight} x2={data.length * 80} y2={chartHeight - pct * chartHeight}
              stroke="var(--border)" strokeWidth="1" />
          ))}

          {/* Views line */}
          <polyline
            fill="none" stroke="var(--brand)" strokeWidth="2"
            points={data.map((d, i) => `${i * 80 + 40},${chartHeight - (d.views / maxVal) * (chartHeight - 20)}`).join(' ')}
          />

          {/* Clicks line */}
          <polyline
            fill="none" stroke="var(--green)" strokeWidth="2"
            points={data.map((d, i) => `${i * 80 + 40},${chartHeight - (d.clicks / maxVal) * (chartHeight - 20)}`).join(' ')}
          />

          {/* Dots */}
          {data.map((d, i) => (
            <g key={i}>
              <circle cx={i * 80 + 40} cy={chartHeight - (d.views / maxVal) * (chartHeight - 20)} r="3" fill="var(--brand)" />
              <circle cx={i * 80 + 40} cy={chartHeight - (d.clicks / maxVal) * (chartHeight - 20)} r="3" fill="var(--green)" />
            </g>
          ))}
        </svg>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-2">
        {data.map(d => (
          <span key={d.label} className="text-[10px]" style={{ color: 'var(--text-dim)', width: 80, textAlign: 'center' }}>{d.label}</span>
        ))}
      </div>
    </div>
  )
}

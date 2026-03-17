interface ScoreBarProps {
  label: string
  value: number
  max: number
  color?: string
}

export function ScoreBar({ label, value, max, color }: ScoreBarProps) {
  const safeVal = (value != null && !isNaN(Number(value))) ? Number(value) : 0
  const pct = max > 0 ? Math.min((safeVal / max) * 100, 100) : 0
  const barColor = color ?? (pct >= 70 ? 'var(--green)' : pct >= 40 ? 'var(--yellow)' : 'var(--red)')
  const display = safeVal === 0 && (value === null || value === undefined) ? 'N/A' : safeVal.toFixed(1)

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[10px]" style={{ color: 'var(--text-muted)' }}>
        <span>{label}</span>
        <span style={{ color: display === 'N/A' ? 'var(--text-dim)' : barColor }}>{display}</span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: 'var(--surface-3)' }}>
        <div
          className="h-1.5 rounded-full transition-all"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
    </div>
  )
}

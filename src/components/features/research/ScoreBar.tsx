interface ScoreBarProps {
  label: string
  value: number
  max: number
  color?: string
}

export function ScoreBar({ label, value, max, color }: ScoreBarProps) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const barColor = color ?? (pct >= 70 ? 'var(--green)' : pct >= 40 ? 'var(--yellow)' : 'var(--red)')

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[10px]" style={{ color: 'var(--text-muted)' }}>
        <span>{label}</span>
        <span style={{ color: barColor }}>{Number(value).toFixed(1)}</span>
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

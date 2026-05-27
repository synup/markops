interface ResearchScoreBarProps {
  label: string
  value: number | null | undefined
  max: number
  color?: 'cyan' | 'blue'
}

export function ResearchScoreBar({ label, value, max, color }: ResearchScoreBarProps) {
  const isNullish = value === null || value === undefined
  const numeric = isNullish ? 0 : Number(value)
  const safeVal = Number.isFinite(numeric) ? numeric : 0
  const pct = max > 0 ? Math.min((safeVal / max) * 100, 100) : 0

  const fillClass = color === 'cyan'
    ? 'bg-cyan-500'
    : color === 'blue'
      ? 'bg-blue-500'
      : pct >= 70
        ? 'bg-emerald-500'
        : pct >= 40
          ? 'bg-amber-500'
          : 'bg-rose-500'

  const display = isNullish ? 'N/A' : safeVal.toFixed(1)
  const valueColor = isNullish
    ? 'text-slate-400'
    : color === 'cyan'
      ? 'text-cyan-700'
      : color === 'blue'
        ? 'text-blue-700'
        : pct >= 70
          ? 'text-emerald-700'
          : pct >= 40
            ? 'text-amber-700'
            : 'text-rose-700'

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="text-slate-500">{label}</span>
        <span className={`${valueColor} tabular-nums`}>{display}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-[width] duration-200 ${fillClass}`}
          style={{ width: isNullish ? '0%' : `${pct}%` }}
        />
      </div>
    </div>
  )
}

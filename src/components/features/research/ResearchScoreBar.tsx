type Props = {
  label: string
  value: number | null
  max: number
}

export function ResearchScoreBar({ label, value, max }: Props) {
  const pct = value != null ? Math.max(0, Math.min(100, (value / max) * 100)) : 0
  const display = value != null ? `${value.toFixed(1)}/${max}` : '—'

  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 text-sm text-slate-500">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-slate-100">
        <div
          className="h-1.5 rounded-full bg-cyan-500 transition-[width] duration-200"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-12 shrink-0 text-right text-sm text-slate-700 tabular-nums">
        {display}
      </span>
    </div>
  )
}

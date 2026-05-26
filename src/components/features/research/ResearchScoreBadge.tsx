type Props = {
  score: number | null | undefined
  max: number
  className?: string
}

export function ResearchScoreBadge({ score, max, className = '' }: Props) {
  const pct = score != null ? score / max : null
  const colors =
    pct != null && pct >= 0.70
      ? 'bg-emerald-50 text-emerald-700'
      : pct != null && pct >= 0.40
        ? 'bg-amber-50 text-amber-700'
        : 'bg-slate-100 text-slate-600'
  const display =
    score != null ? `${Number(score).toFixed(0)} / ${max}` : `— / ${max}`
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-medium ${colors} ${className}`}
    >
      {display}
    </span>
  )
}

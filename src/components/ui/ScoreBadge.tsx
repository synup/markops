type Props = {
  score: number | null | undefined
  className?: string
}

export function ScoreBadge({ score, className = '' }: Props) {
  const colors =
    score != null && score >= 18
      ? 'bg-emerald-50 text-emerald-700'
      : score != null && score >= 12
        ? 'bg-amber-50 text-amber-700'
        : 'bg-slate-100 text-slate-600'
  const display = score != null ? `${score} / 25` : '— / 25'
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-medium ${colors} ${className}`}
    >
      {display}
    </span>
  )
}

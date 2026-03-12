interface StatusBadgeProps {
  status: 'candidate' | 'approved' | 'denied' | 'pushed' | 'pass' | 'fail' | 'warning'
}

const STYLES: Record<string, { bg: string; color: string; label: string }> = {
  candidate: { bg: 'var(--surface-3)', color: 'var(--text-muted)', label: 'Pending' },
  approved:  { bg: 'var(--green-muted)', color: 'var(--green)', label: 'Approved' },
  denied:    { bg: 'var(--red-muted)', color: 'var(--red)', label: 'Denied' },
  pushed:    { bg: 'var(--brand-muted)', color: 'var(--brand)', label: 'Pushed' },
  pass:      { bg: 'var(--green-muted)', color: 'var(--green)', label: 'Pass' },
  fail:      { bg: 'var(--red-muted)', color: 'var(--red)', label: 'Fail' },
  warning:   { bg: 'var(--yellow-muted)', color: 'var(--yellow)', label: 'Warning' },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const s = STYLES[status] ?? STYLES.candidate
  return (
    <span
      className="inline-block rounded px-2 py-0.5 text-[10px] font-semibold"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  )
}

interface StatCardProps {
  label: string
  value: string | number
  subtext?: string
  color?: string
}

export function StatCard({ label, value, subtext, color }: StatCardProps) {
  return (
    <div
      className="rounded-lg p-4"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
        {label}
      </div>
      <div
        className="mt-1 text-2xl font-bold"
        style={{ color: color ?? 'var(--text)' }}
      >
        {value}
      </div>
      {subtext && (
        <div className="mt-0.5 text-xs" style={{ color: 'var(--text-dim)' }}>
          {subtext}
        </div>
      )}
    </div>
  )
}

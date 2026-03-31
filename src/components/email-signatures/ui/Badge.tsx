interface BadgeProps {
  variant?: 'active' | 'draft' | 'override' | 'default'
  children: React.ReactNode
}

const variantStyles: Record<string, React.CSSProperties> = {
  active: { background: 'var(--green-muted)', color: 'var(--green)', border: '1px solid rgba(34,197,94,0.3)' },
  draft: { background: 'var(--surface-3)', color: 'var(--text-muted)', border: '1px solid var(--border)' },
  override: { background: 'var(--brand-muted)', color: 'var(--brand)', border: '1px solid var(--brand-border)' },
  default: { background: 'var(--brand-muted)', color: 'var(--brand)', border: '1px solid var(--brand-border)' },
}

export function Badge({ variant = 'default', children }: BadgeProps) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium"
      style={variantStyles[variant]}
    >
      {children}
    </span>
  )
}

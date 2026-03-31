import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const sizeClasses: Record<string, string> = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
}

const variantStyles: Record<string, React.CSSProperties> = {
  primary: { background: 'var(--brand)', color: '#fff' },
  secondary: { background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' },
  ghost: { color: 'var(--text-muted)', background: 'transparent' },
  danger: { background: 'var(--red-muted)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.3)' },
}

export function Button({
  variant = 'primary', size = 'md', loading, children, className, disabled, style, ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses[size]} ${className ?? ''}`}
      style={{ ...variantStyles[variant], ...style }}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  )
}

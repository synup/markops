'use client'

import { useAuth } from '@/hooks/useAuth'

interface TopbarProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function Topbar({ title, subtitle, actions }: TopbarProps) {
  const { profile, signOut } = useAuth()

  return (
    <header
      className="flex h-14 items-center justify-between px-6"
      style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
    >
      <div>
        <h1 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{title}</h1>
        {subtitle && (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {actions}
        {profile && (
          <button
            onClick={signOut}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors"
            style={{ color: 'var(--text-muted)', background: 'var(--surface-2)' }}
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
              style={{ background: 'var(--brand)' }}
            >
              {profile.full_name?.slice(0, 2).toUpperCase() ?? profile.email.slice(0, 2).toUpperCase()}
            </span>
            {profile.full_name ?? profile.email.split('@')[0]}
          </button>
        )}
      </div>
    </header>
  )
}

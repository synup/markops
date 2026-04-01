'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Settings, Plug, Users } from 'lucide-react'

const SETTINGS_NAV = [
  { label: 'General', href: '/email-signatures/settings', icon: Settings },
  { label: 'Integrations', href: '/email-signatures/settings/integrations', icon: Plug },
  { label: 'User Access Management', href: '/email-signatures/settings/users', icon: Users },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div className="flex gap-6">
      <aside className="w-56 shrink-0 space-y-1">
        {SETTINGS_NAV.map(item => {
          const Icon = item.icon
          const active = item.href === '/email-signatures/settings'
            ? pathname === '/email-signatures/settings'
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
              style={{
                background: active ? 'var(--brand-muted)' : 'transparent',
                color: active ? 'var(--brand)' : 'var(--text-muted)',
                fontWeight: active ? 500 : 400,
              }}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </aside>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}

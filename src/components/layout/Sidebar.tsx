'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: '◉' },
  { label: 'Adwords Audit', href: '/audit', icon: '✓' },
  { label: 'Campaigns', href: '/campaigns', icon: '▶' },
  { label: 'Keywords', href: '/keywords', icon: '⌕' },
  { label: 'Reddit', href: '/research', icon: '◈' },
  { label: 'Settings', href: '/settings', icon: '⚙' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="flex h-screen w-[216px] min-w-[216px] flex-col overflow-y-auto"
      style={{ background: 'var(--bg)', borderRight: '1px solid var(--border-subtle)' }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-2 px-3 py-4"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold text-white"
          style={{ background: 'var(--brand)' }}
        >
          M
        </div>
        <div>
          <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Marketing HQ</div>
          <div className="text-[11px]" style={{ color: 'var(--text-dim)' }}>Synup</div>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="mt-2 flex flex-col gap-0.5 px-2">
        {NAV_ITEMS.map(item => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors"
              style={{
                color: isActive ? 'var(--text)' : 'var(--text-muted)',
                background: isActive ? 'var(--surface-2)' : 'transparent',
              }}
            >
              <span className="w-4 text-center text-xs">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

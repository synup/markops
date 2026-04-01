'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { label: 'Signature Management', href: '/email-signatures' },
  { label: 'Company Data', href: '/email-signatures/company-data' },
  { label: 'Campaigns', href: '/email-signatures/campaigns' },
  { label: 'Analytics', href: '/email-signatures/analytics' },
  { label: 'Settings', href: '/email-signatures/settings' },
]

export default function EmailSignaturesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/email-signatures') {
      return pathname === '/email-signatures' || pathname.startsWith('/email-signatures/new') || /^\/email-signatures\/[^/]+\/edit/.test(pathname)
    }
    return pathname.startsWith(href)
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-dim)' }}>
          Email Signatures
        </h2>
        <nav className="flex gap-1" style={{ borderBottom: '1px solid var(--border)' }}>
          {NAV.map(item => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className="px-4 py-2.5 text-sm font-medium transition-colors -mb-px"
                style={{
                  color: active ? 'var(--brand)' : 'var(--text-muted)',
                  borderBottom: active ? '2px solid var(--brand)' : '2px solid transparent',
                }}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
      {children}
    </div>
  )
}

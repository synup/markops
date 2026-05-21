'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { useBrandAlerts } from '@/hooks/useRedditResearch'

const MessageSquareIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
)

type NavChild = { label: string; href: string }
type NavItem  = { label: string; href: string; icon: ReactNode; children?: NavChild[] }

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: '◉' },
  { label: 'Adwords Audit', href: '/audit', icon: '✓' },
  { label: 'Campaigns', href: '/campaigns', icon: '▶' },
  { label: 'Keywords', href: '/keywords', icon: '⌕' },
  { label: 'Leads', href: '/leads', icon: '◆' },
  { label: 'Reddit', href: '/research', icon: '◈' },
  {
    label: 'Conversations',
    href: '/conversations',
    icon: MessageSquareIcon,
    children: [
      { label: 'Brief prompts', href: '/conversations/brief-prompts' },
    ],
  },
  { label: 'AI Visibility', href: '/ai-visibility', icon: '◉' },
  { label: 'pSEO Content', href: '/pseo-content', icon: '◎' },
  { label: 'Email Sigs', href: '/email-signatures', icon: '✉' },
  { label: 'Error Logs', href: '/errors', icon: '⚠' },
  { label: 'Settings', href: '/settings', icon: '⚙' },
]

function isParentActive(itemHref: string, pathname: string) {
  if (itemHref === '/') return pathname === '/'
  // Parent is active when the URL is its own page; child links handle their own
  // active state separately so the parent doesn't double-highlight when a child
  // route is active.
  return pathname === itemHref
}

export function Sidebar() {
  const pathname = usePathname()
  const { count: brandMentionCount } = useBrandAlerts()
  // Every parent that has children starts expanded. v1: no localStorage.
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(NAV_ITEMS.filter(i => i.children?.length).map(i => i.label)),
  )
  const toggle = (label: string) =>
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label); else next.add(label)
      return next
    })

  return (
    <aside
      className="flex h-screen w-[216px] min-w-[216px] flex-col overflow-y-auto"
      style={{ background: 'var(--bg)', borderRight: '1px solid var(--border-subtle)' }}
    >
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

      <nav className="mt-2 flex flex-col gap-0.5 px-2">
        {NAV_ITEMS.map(item => {
          const parentActive = isParentActive(item.href, pathname)
          const badge = item.href === '/research' && brandMentionCount > 0 ? brandMentionCount : 0
          const hasChildren = !!item.children?.length
          const isOpen = expanded.has(item.label)
          return (
            <div key={item.href}>
              <div className="flex items-center">
                <Link
                  href={item.href}
                  className="flex flex-1 items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors"
                  style={{
                    color: parentActive ? 'var(--text)' : 'var(--text-muted)',
                    background: parentActive ? 'var(--surface-2)' : 'transparent',
                  }}
                >
                  <span className="w-4 text-center text-xs">{item.icon}</span>
                  {item.label}
                  {badge > 0 && (
                    <span
                      className="ml-auto flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none text-white"
                      style={{ background: 'var(--red)' }}
                    >
                      {badge}
                    </span>
                  )}
                </Link>
                {hasChildren && (
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); toggle(item.label) }}
                    aria-label={isOpen ? `Collapse ${item.label}` : `Expand ${item.label}`}
                    aria-expanded={isOpen}
                    className="ml-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className={`transition-transform duration-150 ${isOpen ? '' : '-rotate-90'}`}><path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                )}
              </div>
              {hasChildren && isOpen && item.children!.map(child => {
                const childActive = pathname === child.href || pathname.startsWith(child.href + '/')
                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    className="block rounded-md border-l-2 py-1.5 pl-10 pr-3 text-[13px] transition-colors"
                    style={{
                      borderLeftColor: childActive ? 'var(--brand)' : 'transparent',
                      color: childActive ? 'var(--text)' : 'var(--text-muted)',
                      background: childActive ? 'var(--surface-2)' : 'transparent',
                    }}
                  >
                    {child.label}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}

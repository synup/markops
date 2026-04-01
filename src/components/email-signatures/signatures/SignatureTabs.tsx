import type { Signature } from '@/types/email-signatures'

interface SignatureTabsProps {
  signatures: Signature[]
  activeTab: 'all' | 'active' | 'draft'
  onTabChange: (tab: 'all' | 'active' | 'draft') => void
}

export function SignatureTabs({ signatures, activeTab, onTabChange }: SignatureTabsProps) {
  const allCount = signatures.length
  const activeCount = signatures.filter(s => s.status === 'active').length
  const draftCount = signatures.filter(s => s.status === 'draft').length

  const tabs: { key: 'all' | 'active' | 'draft'; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: allCount },
    { key: 'active', label: 'Active', count: activeCount },
    { key: 'draft', label: 'Draft', count: draftCount },
  ]

  return (
    <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: 'var(--surface-2)' }}>
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
          style={{
            background: activeTab === tab.key ? 'var(--surface)' : 'transparent',
            color: activeTab === tab.key ? 'var(--text)' : 'var(--text-muted)',
            boxShadow: activeTab === tab.key ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
          }}
        >
          {tab.label}
          <span className="ml-1.5 text-xs" style={{ color: 'var(--text-dim)' }}>{tab.count}</span>
        </button>
      ))}
    </div>
  )
}

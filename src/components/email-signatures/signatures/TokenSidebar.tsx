'use client'

import { Plus } from 'lucide-react'

const PERSONAL_TOKENS = [
  { token: '{{first_name}}', label: 'First Name' },
  { token: '{{last_name}}', label: 'Last Name' },
  { token: '{{full_name}}', label: 'Full Name' },
  { token: '{{email}}', label: 'Email' },
  { token: '{{job_title}}', label: 'Job Title' },
  { token: '{{department}}', label: 'Department' },
  { token: '{{phone_mobile}}', label: 'Phone Mobile' },
  { token: '{{phone_work}}', label: 'Phone Work' },
]

const COMPANY_TOKENS = [
  { token: '{{company_name}}', label: 'Company Name' },
  { token: '{{company_website}}', label: 'Company Website' },
]

interface TokenSidebarProps {
  onInsert: (token: string) => void
}

function TokenChip({ token, label, onInsert }: { token: string; label: string; onInsert: (t: string) => void }) {
  return (
    <button
      onClick={() => onInsert(token)}
      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors group"
      style={{ color: 'var(--text-muted)' }}
    >
      <Plus className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--brand)' }} />
      <div className="flex-1 text-left min-w-0">
        <span style={{ color: 'var(--text)' }}>{label}</span>
        <span className="ml-1.5 font-mono" style={{ color: 'var(--text-dim)' }}>{token}</span>
      </div>
    </button>
  )
}

export function TokenSidebar({ onInsert }: TokenSidebarProps) {
  return (
    <aside className="w-60 shrink-0 overflow-y-auto" style={{ background: 'var(--surface)', borderLeft: '1px solid var(--border)' }}>
      <div className="p-4">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-dim)' }}>
          User Info
        </h3>
      </div>

      <div className="px-2">
        <p className="px-2.5 text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
          Personal Information
        </p>
        {PERSONAL_TOKENS.map(t => (
          <TokenChip key={t.token} token={t.token} label={t.label} onInsert={onInsert} />
        ))}
      </div>

      <div className="px-2 mt-4">
        <p className="px-2.5 text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
          Company Information
        </p>
        {COMPANY_TOKENS.map(t => (
          <TokenChip key={t.token} token={t.token} label={t.label} onInsert={onInsert} />
        ))}
      </div>
    </aside>
  )
}

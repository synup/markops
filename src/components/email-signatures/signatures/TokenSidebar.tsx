'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

const TOKENS = [
  { token: '{{first_name}}', label: 'First name' },
  { token: '{{last_name}}', label: 'Last name' },
  { token: '{{full_name}}', label: 'Full name' },
  { token: '{{job_title}}', label: 'Job title' },
  { token: '{{department}}', label: 'Department' },
  { token: '{{email}}', label: 'Email' },
  { token: '{{phone_mobile}}', label: 'Mobile phone' },
  { token: '{{phone_work}}', label: 'Work phone' },
]

export function TokenSidebar() {
  const [copied, setCopied] = useState<string | null>(null)

  const copy = (token: string) => {
    navigator.clipboard.writeText(token)
    setCopied(token)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <aside className="w-56 shrink-0 p-4 overflow-y-auto" style={{ background: 'var(--surface)', borderLeft: '1px solid var(--border)' }}>
      <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
        Variable tokens
      </h3>
      <div className="space-y-1">
        {TOKENS.map(t => (
          <button
            key={t.token}
            onClick={() => copy(t.token)}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <div>
              <span className="font-mono" style={{ color: 'var(--brand)' }}>{t.token}</span>
              <span className="ml-2" style={{ color: 'var(--text-dim)' }}>{t.label}</span>
            </div>
            {copied === t.token ? <Check className="w-3 h-3" style={{ color: 'var(--green)' }} /> : <Copy className="w-3 h-3" />}
          </button>
        ))}
      </div>
    </aside>
  )
}

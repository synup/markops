'use client'

import { useState } from 'react'
import { Button } from '@/components/email-signatures/ui/Button'
import { Save } from 'lucide-react'

export function GeneralSettings() {
  const [companyName, setCompanyName] = useState('Synup')
  const [defaultSender, setDefaultSender] = useState('noreply@synup.com')

  const inputStyle: React.CSSProperties = {
    background: 'var(--surface-2)', color: 'var(--text)',
    border: '1px solid var(--border)',
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl p-5 space-y-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Organization</h3>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Company name</label>
          <input value={companyName} onChange={e => setCompanyName(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Default sender email</label>
          <input value={defaultSender} onChange={e => setDefaultSender(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
        </div>
        <div className="flex justify-end">
          <Button size="sm"><Save className="w-3.5 h-3.5" />Save</Button>
        </div>
      </div>

      <div className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>Danger zone</h3>
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
          Remove all signatures from Gmail for every user. This cannot be undone.
        </p>
        <Button variant="danger" size="sm">Remove all signatures</Button>
      </div>
    </div>
  )
}

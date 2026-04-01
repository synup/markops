'use client'

import { useState } from 'react'
import { Monitor, Smartphone } from 'lucide-react'
import { useESUsers } from '@/hooks/useESUsers'
import { resolveTokens } from '@/lib/signatures/resolveTokens'

interface SignaturePreviewProps {
  html: string
}

const selectStyle: React.CSSProperties = {
  background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)',
}

export function SignaturePreview({ html }: SignaturePreviewProps) {
  const { users } = useESUsers()
  const [selectedUserId, setSelectedUserId] = useState('')
  const [view, setView] = useState<'desktop' | 'mobile'>('desktop')

  const selectedUser = users.find(u => u.id === selectedUserId)
  const resolvedHtml = selectedUser ? resolveTokens(html, selectedUser) : html

  return (
    <div style={{ borderTop: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between px-4 py-2.5" style={{ background: 'var(--surface)' }}>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Signature Preview
          </span>
          <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}
            className="rounded-lg px-2.5 py-1 text-xs outline-none" style={selectStyle}>
            <option value="">Select User (raw tokens)</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.first_name} {u.last_name} — {u.email}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ background: 'var(--surface-2)' }}>
          {([['desktop', Monitor], ['mobile', Smartphone]] as const).map(([key, Icon]) => (
            <button key={key} onClick={() => setView(key)}
              className="p-1.5 rounded-md transition-colors"
              style={{ background: view === key ? 'var(--surface)' : 'transparent', color: view === key ? 'var(--text)' : 'var(--text-dim)' }}>
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-center p-4" style={{ background: 'var(--surface-2)', minHeight: 120 }}>
        <div className="rounded-lg p-4 shadow-sm" style={{
          background: '#ffffff', width: view === 'desktop' ? '100%' : 375,
          maxWidth: '100%', transition: 'width 0.2s ease',
        }}>
          {resolvedHtml ? (
            <div dangerouslySetInnerHTML={{ __html: resolvedHtml }} />
          ) : (
            <p className="text-xs text-center" style={{ color: '#999' }}>Start typing to see a preview</p>
          )}
        </div>
      </div>
      {selectedUser && (
        <div className="px-4 py-1.5 text-[11px]" style={{ color: 'var(--text-dim)', background: 'var(--surface)' }}>
          Previewing as: {selectedUser.first_name} {selectedUser.last_name} ({selectedUser.email})
        </div>
      )}
    </div>
  )
}

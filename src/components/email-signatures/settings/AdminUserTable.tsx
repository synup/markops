'use client'

import { useState } from 'react'
import { Badge } from '@/components/email-signatures/ui/Badge'
import { Button } from '@/components/email-signatures/ui/Button'
import { Modal } from '@/components/email-signatures/ui/Modal'
import { Plus, Trash2 } from 'lucide-react'

interface AdminEntry {
  id: string
  email: string
  role: 'Super Admin' | 'Admin'
  status: 'Active' | 'Invited'
}

const MOCK_ADMINS: AdminEntry[] = [
  { id: '1', email: 'niladri@synup.com', role: 'Super Admin', status: 'Active' },
  { id: '2', email: 'admin@synup.com', role: 'Admin', status: 'Active' },
]

export function AdminUserTable() {
  const [admins, setAdmins] = useState<AdminEntry[]>(MOCK_ADMINS)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'Admin' | 'Super Admin'>('Admin')

  const handleInvite = () => {
    if (!inviteEmail.trim()) return
    setAdmins(prev => [...prev, {
      id: crypto.randomUUID(),
      email: inviteEmail.trim(),
      role: inviteRole,
      status: 'Invited',
    }])
    setInviteEmail('')
    setShowInvite(false)
  }

  const handleRemove = (id: string) => {
    if (!confirm('Remove this admin?')) return
    setAdmins(prev => prev.filter(a => a.id !== id))
  }

  const inputStyle: React.CSSProperties = {
    background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{admins.length} admin{admins.length !== 1 ? 's' : ''}</p>
        <Button size="sm" onClick={() => setShowInvite(true)}><Plus className="w-3.5 h-3.5" />Invite User</Button>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--surface-2)' }}>
              {['Email', 'Role', 'Status', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {admins.map(a => (
              <tr key={a.id} style={{ borderTop: '1px solid var(--border)' }}>
                <td className="px-4 py-3 font-medium" style={{ color: 'var(--text)' }}>{a.email}</td>
                <td className="px-4 py-3">
                  <Badge variant={a.role === 'Super Admin' ? 'default' : 'draft'}>{a.role}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={a.status === 'Active' ? 'active' : 'draft'}>{a.status}</Badge>
                </td>
                <td className="px-4 py-3">
                  {a.role !== 'Super Admin' && (
                    <button onClick={() => handleRemove(a.id)} style={{ color: 'var(--text-dim)' }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={showInvite} onClose={() => setShowInvite(false)} title="Invite Admin User">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Email</label>
            <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
              placeholder="user@synup.com"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Role</label>
            <select value={inviteRole} onChange={e => setInviteRole(e.target.value as typeof inviteRole)}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}>
              <option value="Admin">Admin</option>
              <option value="Super Admin">Super Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowInvite(false)}>Cancel</Button>
            <Button onClick={handleInvite}>Send Invite</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

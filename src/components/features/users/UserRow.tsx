'use client'

import { useState } from 'react'
import type { Profile } from '@/types'

interface UserRowProps {
  user: Profile
  isCurrentUser: boolean
  onUpdateRole: (userId: string, role: Profile['role']) => Promise<boolean>
}

const ROLE_COLORS: Record<string, string> = {
  admin: '#7c3aed',
  editor: '#3b82f6',
  viewer: '#6b7280',
}

export function UserRow({ user, isCurrentUser, onUpdateRole }: UserRowProps) {
  const [updating, setUpdating] = useState(false)

  const handleRoleChange = async (role: Profile['role']) => {
    setUpdating(true)
    await onUpdateRole(user.id, role)
    setUpdating(false)
  }

  return (
    <div
      className="flex items-center justify-between rounded-lg px-4 py-3"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-3">
        {user.avatar_url ? (
          <img src={user.avatar_url} alt="" className="h-8 w-8 rounded-full" />
        ) : (
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ background: ROLE_COLORS[user.role] }}
          >
            {(user.full_name || user.email)[0].toUpperCase()}
          </div>
        )}
        <div>
          <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>
            {user.full_name || user.email.split('@')[0]}
            {isCurrentUser && (
              <span className="ml-2 text-xs" style={{ color: 'var(--text-muted)' }}>(you)</span>
            )}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{user.email}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isCurrentUser ? (
          <span
            className="rounded px-2.5 py-1 text-xs font-medium"
            style={{ background: `${ROLE_COLORS[user.role]}22`, color: ROLE_COLORS[user.role] }}
          >
            {user.role}
          </span>
        ) : (
          <select
            value={user.role}
            disabled={updating}
            onChange={e => handleRoleChange(e.target.value as Profile['role'])}
            className="rounded-md px-2.5 py-1.5 text-xs"
            style={{
              background: 'var(--bg)',
              color: ROLE_COLORS[user.role],
              border: '1px solid var(--border)',
              opacity: updating ? 0.5 : 1,
            }}
          >
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </select>
        )}
      </div>
    </div>
  )
}

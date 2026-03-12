'use client'

import { useUsers } from '@/hooks/useUsers'
import { UserRow } from './UserRow'

interface UserManagementProps {
  currentUserId: string
  siteUrl?: string
}

export function UserManagement({ currentUserId, siteUrl }: UserManagementProps) {
  const { users, loading, updateRole } = useUsers()

  if (loading) {
    return (
      <div className="py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        Loading users...
      </div>
    )
  }

  const admins = users.filter(u => u.role === 'admin')
  const others = users.filter(u => u.role !== 'admin')

  return (
    <div
      className="rounded-lg p-5"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
          Team Members
        </h3>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {users.length} user{users.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="mb-4 rounded-md px-3 py-2.5 text-xs" style={{ background: 'rgba(124,58,237,0.08)', color: '#a78bfa' }}>
        Any @synup.com colleague can join by visiting the app URL and signing in with Google.
        They'll be added as a <strong>Viewer</strong> by default. Admins can upgrade roles below.
      </div>

      <div className="flex flex-col gap-2">
        {[...admins, ...others].map(user => (
          <UserRow
            key={user.id}
            user={user}
            isCurrentUser={user.id === currentUserId}
            onUpdateRole={updateRole}
          />
        ))}
      </div>

      {users.length === 0 && (
        <div className="py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          No team members yet. Share the app URL with @synup.com colleagues.
        </div>
      )}
    </div>
  )
}

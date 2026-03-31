'use client'

import { useState } from 'react'
import { useESUsers } from '@/hooks/useESUsers'
import { UserTableFilters } from './UserTableFilters'
import { UserTableRow } from './UserTableRow'
import type { WorkspaceUser } from '@/types/email-signatures'

interface UserTableProps {
  onEditUser: (u: WorkspaceUser) => void
}

export function UserTable({ onEditUser }: UserTableProps) {
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('')
  const { users, loading } = useESUsers({ search, department })

  return (
    <div className="space-y-4">
      <UserTableFilters
        search={search}
        onSearchChange={setSearch}
        department={department}
        onDepartmentChange={setDepartment}
        users={users}
      />
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--surface-2)' }}>
              {['Name', 'Email', 'Title', 'Department', 'Override', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} className="px-4 py-3">
                    <div className="h-4 rounded animate-pulse" style={{ background: 'var(--surface-2)' }} />
                  </td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  No users found. Sync from Google Workspace to populate.
                </td>
              </tr>
            ) : (
              users.map(u => <UserTableRow key={u.id} user={u} onEdit={() => onEditUser(u)} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

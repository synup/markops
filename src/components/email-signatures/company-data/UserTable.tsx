'use client'

import { useState } from 'react'
import { useESUsers } from '@/hooks/useESUsers'
import { useESSignatures } from '@/hooks/useESSignatures'
import { UserTableFilters } from './UserTableFilters'
import { UserTableRow } from './UserTableRow'
import type { WorkspaceUser } from '@/types/email-signatures'

const COLUMNS = ['User', 'Active Signature', 'Job Title', 'Department', 'Org Unit', 'Phone', '']

interface UserTableProps {
  onEditUser: (u: WorkspaceUser) => void
}

export function UserTable({ onEditUser }: UserTableProps) {
  const [search, setSearch] = useState('')
  const [signatureId, setSignatureId] = useState('')
  const [orgUnit, setOrgUnit] = useState('')
  const { users, loading } = useESUsers({ search, orgUnit })
  const { signatures } = useESSignatures()

  const filtered = signatureId
    ? users.filter(u => u.active_signature?.id === signatureId)
    : users

  return (
    <div className="space-y-4">
      <UserTableFilters
        search={search} onSearchChange={setSearch}
        signatureId={signatureId} onSignatureIdChange={setSignatureId}
        orgUnit={orgUnit} onOrgUnitChange={setOrgUnit}
        users={users} signatures={signatures}
      />
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--surface-2)' }}>
              {COLUMNS.map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={7} className="px-4 py-3">
                    <div className="h-4 rounded animate-pulse" style={{ background: 'var(--surface-2)' }} />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  No users found. Sync from Google Workspace to populate.
                </td>
              </tr>
            ) : (
              filtered.map(u => <UserTableRow key={u.id} user={u} onEdit={() => onEditUser(u)} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

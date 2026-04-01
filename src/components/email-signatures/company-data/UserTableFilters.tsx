import { Search } from 'lucide-react'
import type { WorkspaceUser, Signature } from '@/types/email-signatures'

interface UserTableFiltersProps {
  search: string
  onSearchChange: (v: string) => void
  signatureId: string
  onSignatureIdChange: (v: string) => void
  orgUnit: string
  onOrgUnitChange: (v: string) => void
  users: WorkspaceUser[]
  signatures: Signature[]
}

const selectStyle: React.CSSProperties = {
  background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)',
}

export function UserTableFilters({
  search, onSearchChange, signatureId, onSignatureIdChange,
  orgUnit, onOrgUnitChange, users, signatures,
}: UserTableFiltersProps) {
  const orgUnits = [...new Set(users.map(u => u.org_unit).filter(Boolean))] as string[]

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-dim)' }} />
        <input
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search users..."
          className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none"
          style={selectStyle}
        />
      </div>
      <select value={signatureId} onChange={e => onSignatureIdChange(e.target.value)}
        className="rounded-lg px-3 py-2 text-sm outline-none" style={selectStyle}>
        <option value="">All Signatures</option>
        {signatures.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      <select value={orgUnit} onChange={e => onOrgUnitChange(e.target.value)}
        className="rounded-lg px-3 py-2 text-sm outline-none" style={selectStyle}>
        <option value="">All Org Units</option>
        {orgUnits.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

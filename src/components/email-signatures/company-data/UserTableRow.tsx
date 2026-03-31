import { Pencil } from 'lucide-react'
import { Badge } from '@/components/email-signatures/ui/Badge'
import type { WorkspaceUser } from '@/types/email-signatures'

interface UserTableRowProps {
  user: WorkspaceUser
  onEdit: () => void
}

export function UserTableRow({ user, onEdit }: UserTableRowProps) {
  return (
    <tr style={{ borderTop: '1px solid var(--border)' }}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
            style={{ background: 'var(--brand-muted)', color: 'var(--brand)' }}
          >
            {(user.first_name?.[0] ?? user.email[0]).toUpperCase()}
          </div>
          <span className="font-medium text-sm" style={{ color: 'var(--text)' }}>
            {user.first_name} {user.last_name}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>{user.email}</td>
      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>{user.job_title ?? '—'}</td>
      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>{user.department ?? '—'}</td>
      <td className="px-4 py-3">
        {user.signature_override && <Badge variant="override">Override</Badge>}
      </td>
      <td className="px-4 py-3">
        <button onClick={onEdit} style={{ color: 'var(--text-dim)' }}>
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </td>
    </tr>
  )
}

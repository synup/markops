import { Pencil } from 'lucide-react'
import { Badge } from '@/components/email-signatures/ui/Badge'
import type { WorkspaceUser } from '@/types/email-signatures'

interface UserTableRowProps {
  user: WorkspaceUser
  onEdit: () => void
}

export function UserTableRow({ user, onEdit }: UserTableRowProps) {
  const phone = user.phone_mobile || user.phone_work || '—'
  const sigName = user.active_signature?.name

  return (
    <tr style={{ borderTop: '1px solid var(--border)' }}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
            style={{ background: 'var(--brand-muted)', color: 'var(--brand)' }}
          >
            {(user.first_name?.[0] ?? user.email[0]).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
              {user.first_name} {user.last_name}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--text-dim)' }}>{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm">
        {sigName
          ? <Badge variant="active">{sigName}</Badge>
          : <span style={{ color: 'var(--text-dim)' }}>None</span>
        }
      </td>
      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>{user.job_title ?? '—'}</td>
      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>{user.department ?? '—'}</td>
      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>{user.org_unit ?? '—'}</td>
      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>{phone}</td>
      <td className="px-4 py-3">
        <button onClick={onEdit} style={{ color: 'var(--text-dim)' }}>
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </td>
    </tr>
  )
}

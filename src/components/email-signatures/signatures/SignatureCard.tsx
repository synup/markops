'use client'

import { Users, Pencil, Copy, Trash2, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/email-signatures/ui/Badge'
import { Button } from '@/components/email-signatures/ui/Button'
import type { Signature } from '@/types/email-signatures'

interface SignatureCardProps {
  signature: Signature
  onEdit: (s: Signature) => void
  onDelete: (s: Signature) => void
  onDuplicate: (s: Signature) => void
  onDeploy: (s: Signature) => void
}

export function SignatureCard({ signature, onEdit, onDelete, onDuplicate, onDeploy }: SignatureCardProps) {
  return (
    <div className="rounded-xl overflow-hidden flex flex-col" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{signature.name}</span>
          {signature.is_org_default && <Badge variant="default">Org default</Badge>}
        </div>
        <Badge variant={signature.status === 'active' ? 'active' : 'draft'}>
          {signature.status}
        </Badge>
      </div>

      <div className="flex-1 p-4 min-h-[140px] overflow-hidden relative" style={{ background: 'var(--surface-2)' }}>
        <div
          className="text-xs transform origin-top-left scale-75 pointer-events-none overflow-hidden max-h-48"
          dangerouslySetInnerHTML={{ __html: signature.html_template }}
        />
        <div className="absolute inset-x-0 bottom-0 h-8" style={{ background: 'linear-gradient(transparent, var(--surface-2))' }} />
      </div>

      <div className="p-4 flex items-center justify-between" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--brand)' }}>
          <Users className="w-3.5 h-3.5" />
          {signature.user_count ?? 0} users
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => onDeploy(signature)}><RefreshCw className="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="sm" onClick={() => onEdit(signature)}><Pencil className="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="sm" onClick={() => onDuplicate(signature)}><Copy className="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(signature)}><Trash2 className="w-3.5 h-3.5" /></Button>
        </div>
      </div>
    </div>
  )
}

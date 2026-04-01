'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useESSignatures } from '@/hooks/useESSignatures'
import { SignatureCard } from './SignatureCard'
import { SignatureTabs } from './SignatureTabs'
import { EmptyState } from '@/components/email-signatures/ui/EmptyState'
import { Button } from '@/components/email-signatures/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { Plus, Info } from 'lucide-react'
import type { Signature } from '@/types/email-signatures'

export function SignatureList({ onDeploy }: { onDeploy?: () => void }) {
  const { signatures, loading, refetch } = useESSignatures()
  const router = useRouter()
  const [tab, setTab] = useState<'all' | 'active' | 'draft'>('all')

  const handleEdit = (s: Signature) => router.push(`/email-signatures/${s.id}/edit`)

  const handleDelete = async (s: Signature) => {
    if (!confirm(`Delete "${s.name}"?`)) return
    const supabase = createClient()
    await supabase.from('es_signatures').delete().eq('id', s.id)
    refetch()
  }

  const handleDuplicate = async (s: Signature) => {
    const supabase = createClient()
    await supabase.from('es_signatures').insert({
      name: `${s.name} (copy)`, html_template: s.html_template,
      status: 'draft', is_org_default: false, created_by: 'admin',
    })
    refetch()
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-64 rounded-lg animate-pulse" style={{ background: 'var(--surface-2)' }} />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl h-64 animate-pulse" style={{ background: 'var(--surface-2)' }} />
          ))}
        </div>
      </div>
    )
  }

  if (signatures.length === 0) {
    return (
      <EmptyState icon="✍" title="No signatures yet"
        description="Create your first email signature template to get started."
        action={<Button onClick={() => router.push('/email-signatures/new/edit')}><Plus className="w-4 h-4" /> Create Signature</Button>}
      />
    )
  }

  const filtered = tab === 'all' ? signatures : signatures.filter(s => s.status === tab)
  const orgDefault = filtered.filter(s => s.is_org_default)
  const userSpecific = filtered.filter(s => !s.is_org_default)

  return (
    <div className="space-y-6">
      <SignatureTabs signatures={signatures} activeTab={tab} onTabChange={setTab} />

      {orgDefault.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Org Default Signature
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {orgDefault.map(s => (
              <SignatureCard key={s.id} signature={s} onEdit={handleEdit}
                onDelete={handleDelete} onDuplicate={handleDuplicate} onDeploy={() => onDeploy?.()} />
            ))}
          </div>
        </div>
      )}

      {userSpecific.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              User-Specific Signatures
            </h3>
            <span className="text-xs font-medium px-1.5 py-0.5 rounded" style={{ background: 'var(--surface-3)', color: 'var(--text-dim)' }}>
              {userSpecific.length}
            </span>
            <Info className="w-3.5 h-3.5 cursor-help" style={{ color: 'var(--text-dim)' }} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {userSpecific.map(s => (
              <SignatureCard key={s.id} signature={s} onEdit={handleEdit}
                onDelete={handleDelete} onDuplicate={handleDuplicate} onDeploy={() => onDeploy?.()} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useRouter } from 'next/navigation'
import { useESSignatures } from '@/hooks/useESSignatures'
import { SignatureCard } from './SignatureCard'
import { EmptyState } from '@/components/email-signatures/ui/EmptyState'
import { Button } from '@/components/email-signatures/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { Plus } from 'lucide-react'
import type { Signature } from '@/types/email-signatures'

export function SignatureList({ onDeploy }: { onDeploy?: () => void }) {
  const { signatures, loading, refetch } = useESSignatures()
  const router = useRouter()

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
      name: `${s.name} (copy)`,
      html_template: s.html_template,
      status: 'draft',
      is_org_default: false,
      created_by: 'admin',
    })
    refetch()
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-xl h-64 animate-pulse" style={{ background: 'var(--surface-2)' }} />
        ))}
      </div>
    )
  }

  if (signatures.length === 0) {
    return (
      <EmptyState
        icon="✍"
        title="No signatures yet"
        description="Create your first email signature template to get started."
        action={
          <Button onClick={() => router.push('/email-signatures/new/edit')}>
            <Plus className="w-4 h-4" /> Create Signature
          </Button>
        }
      />
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {signatures.map(s => (
        <SignatureCard
          key={s.id}
          signature={s}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          onDeploy={() => onDeploy?.()}
        />
      ))}
    </div>
  )
}

'use client'

import { useParams, useRouter } from 'next/navigation'
import { useESSignature } from '@/hooks/useESSignatures'
import { SignatureEditor } from '@/components/email-signatures/signatures/SignatureEditor'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'

export default function EditSignaturePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { signature, loading } = useESSignature(id)

  const handleSave = async ({ name, html, status, isDefault }: {
    name: string; html: string; status: 'draft' | 'active'; isDefault: boolean
  }) => {
    const supabase = createClient()
    if (isDefault) {
      await supabase.from('es_signatures').update({ is_org_default: false }).eq('is_org_default', true)
    }
    await supabase.from('es_signatures').update({
      name, html_template: html, status, is_org_default: isDefault, updated_at: new Date().toISOString(),
    }).eq('id', id)
    router.push('/email-signatures')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-6 h-6 border-2 border-t-transparent rounded-full" style={{ borderColor: 'var(--brand)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 140px)' }}>
      <div className="flex items-center gap-3 px-4 py-3 shrink-0" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm transition-colors" style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft className="w-4 h-4" />Back
        </button>
        <span style={{ color: 'var(--text-dim)' }}>/</span>
        <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>Edit Signature</span>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        <SignatureEditor signature={signature ?? {}} onSave={handleSave} />
      </div>
    </div>
  )
}

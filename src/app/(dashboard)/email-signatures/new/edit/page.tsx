'use client'

import { useRouter } from 'next/navigation'
import { SignatureEditor } from '@/components/email-signatures/signatures/SignatureEditor'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'

export default function NewSignaturePage() {
  const router = useRouter()

  const handleSave = async ({ name, html, status, isDefault }: {
    name: string; html: string; status: 'draft' | 'active'; isDefault: boolean
  }) => {
    const supabase = createClient()
    if (isDefault) {
      await supabase.from('es_signatures').update({ is_org_default: false }).eq('is_org_default', true)
    }
    await supabase.from('es_signatures').insert({
      name, html_template: html, status, is_org_default: isDefault, created_by: 'admin',
    })
    router.push('/email-signatures')
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 140px)' }}>
      <div className="flex items-center gap-3 px-4 py-3 shrink-0" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm transition-colors" style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft className="w-4 h-4" />Back
        </button>
        <span style={{ color: 'var(--text-dim)' }}>/</span>
        <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>New Signature</span>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        <SignatureEditor signature={{}} onSave={handleSave} isNew />
      </div>
    </div>
  )
}

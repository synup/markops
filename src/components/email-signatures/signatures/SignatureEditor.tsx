'use client'

import { useRef, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { TokenSidebar } from './TokenSidebar'
import { Button } from '@/components/email-signatures/ui/Button'
import { Save, Eye } from 'lucide-react'
import type { Signature } from '@/types/email-signatures'

const EmailEditor = dynamic(() => import('react-email-editor').then(m => m.default), { ssr: false })

interface SignatureEditorProps {
  signature: Partial<Signature>
  onSave: (data: { name: string; html: string; status: 'draft' | 'active'; isDefault: boolean }) => Promise<void>
}

export function SignatureEditor({ signature, onSave }: SignatureEditorProps) {
  const editorRef = useRef<{ exportHtml: (cb: (data: { html: string }) => void) => void } | null>(null)
  const [name, setName] = useState(signature.name ?? '')
  const [status, setStatus] = useState<'draft' | 'active'>(signature.status ?? 'draft')
  const [isDefault, setIsDefault] = useState(signature.is_org_default ?? false)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const handleSave = useCallback(async () => {
    if (!editorRef.current || !name.trim()) return
    setSaving(true)
    editorRef.current.exportHtml(async ({ html }) => {
      await onSave({ name: name.trim(), html, status, isDefault })
      setSaving(false)
    })
  }, [name, status, isDefault, onSave])

  const handlePreview = useCallback(() => {
    editorRef.current?.exportHtml(({ html }) => setPreview(html))
  }, [])

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Signature name..."
            className="flex-1 text-sm font-medium bg-transparent outline-none"
            style={{ color: 'var(--text)' }}
          />
          <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} />
            Org default
          </label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value as 'draft' | 'active')}
            className="text-xs rounded-md px-2 py-1"
            style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
          </select>
          <Button variant="secondary" size="sm" onClick={handlePreview}><Eye className="w-3.5 h-3.5" />Preview</Button>
          <Button size="sm" onClick={handleSave} loading={saving}><Save className="w-3.5 h-3.5" />Save</Button>
        </div>
        <div className="flex-1">
          <EmailEditor
            ref={(r: unknown) => { editorRef.current = r as typeof editorRef.current }}
            onReady={() => {
              if (signature.html_template) {
                (editorRef.current as unknown as { loadDesign: (d: unknown) => void })?.loadDesign?.({
                  body: { rows: [] },
                  counters: {},
                  schemaVersion: 5,
                })
              }
            }}
            options={{
              appearance: { theme: 'dark' },
              features: { preview: false },
            }}
          />
        </div>
      </div>
      <TokenSidebar />
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setPreview(null)}>
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)' }} />
          <div className="relative max-w-2xl w-full mx-4 rounded-xl p-6" style={{ background: '#fff' }} onClick={e => e.stopPropagation()}>
            <div dangerouslySetInnerHTML={{ __html: preview }} />
          </div>
        </div>
      )}
    </div>
  )
}

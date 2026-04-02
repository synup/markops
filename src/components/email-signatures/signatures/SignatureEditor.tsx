'use client'

import { useState, useCallback } from 'react'
import { TokenSidebar } from './TokenSidebar'
import { Button } from '@/components/email-signatures/ui/Button'
import { Save } from 'lucide-react'
import type { Signature } from '@/types/email-signatures'

interface SignatureEditorProps {
  signature: Partial<Signature>
  onSave: (data: { name: string; html: string; status: 'draft' | 'active'; isDefault: boolean }) => Promise<void>
  isNew?: boolean
}

export function SignatureEditor({ signature, onSave, isNew }: SignatureEditorProps) {
  const [name, setName] = useState(signature.name ?? '')
  const [status, setStatus] = useState<'draft' | 'active'>(signature.status ?? 'draft')
  const [isDefault, setIsDefault] = useState(signature.is_org_default ?? false)
  const [saving, setSaving] = useState(false)
  const [nameError, setNameError] = useState(false)
  const [tab, setTab] = useState<'source' | 'preview'>('source')
  const [sourceHtml, setSourceHtml] = useState(signature.html_template ?? '')

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      setNameError(true)
      return
    }
    setNameError(false)
    setSaving(true)
    await onSave({ name: name.trim(), html: sourceHtml, status, isDefault })
    setSaving(false)
  }, [name, sourceHtml, status, isDefault, onSave])

  const handleInsertToken = useCallback((token: string) => {
    setSourceHtml(prev => prev + token)
  }, [])

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
    if (nameError && e.target.value.trim()) setNameError(false)
  }, [nameError])

  const selectStyle: React.CSSProperties = {
    background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)',
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="shrink-0" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div className="flex items-center gap-3 px-4 py-2.5">
          <input type="text" value={name} onChange={handleNameChange}
            placeholder="Signature name..." className="flex-1 text-sm font-medium bg-transparent outline-none rounded px-2 py-1"
            style={{ color: 'var(--text)', border: nameError ? '1px solid var(--red)' : '1px solid transparent' }} />
          <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} />
            Org default
          </label>
          <select value={status} onChange={e => setStatus(e.target.value as 'draft' | 'active')}
            className="text-xs rounded-md px-2 py-1" style={selectStyle}>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
          </select>
          <Button size="sm" onClick={handleSave} loading={saving} disabled={saving}>
            <Save className="w-3.5 h-3.5" />Save
          </Button>
        </div>
        {nameError && (
          <p className="px-4 pb-2 text-[11px]" style={{ color: 'var(--red)' }}>
            Signature name is required
          </p>
        )}
      </div>

      {/* Editor body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          {/* Source / Preview tabs */}
          <div className="flex items-center gap-0.5 px-3 py-1.5 shrink-0" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
            {(['source', 'preview'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className="px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors"
                style={{ background: tab === t ? 'var(--surface-3)' : 'transparent', color: tab === t ? 'var(--text)' : 'var(--text-muted)' }}>
                {t}
              </button>
            ))}
            {isNew && (
              <span className="ml-3 text-[11px]" style={{ color: 'var(--text-dim)' }}>
                Tip: Paste your existing HTML signature below, or type from scratch
              </span>
            )}
          </div>

          {tab === 'source' ? (
            <div className="flex-1 overflow-auto p-0">
              <textarea value={sourceHtml} onChange={e => setSourceHtml(e.target.value)}
                placeholder="Paste your HTML signature here, or type from scratch"
                className="w-full h-full p-4 text-xs font-mono outline-none resize-none"
                style={{ background: 'var(--surface-2)', color: 'var(--text)', border: 'none' }}
                spellCheck={false} />
            </div>
          ) : (
            <div className="flex-1 overflow-auto" style={{ background: 'var(--surface-2)' }}>
              <div className="p-4 flex justify-center">
                <iframe
                  srcDoc={sourceHtml || '<p style="color:#999;font-family:Arial;font-size:13px;text-align:center;">No HTML to preview</p>'}
                  className="rounded-lg shadow-sm"
                  style={{ background: '#ffffff', width: '100%', maxWidth: 650, minHeight: 200, border: 'none' }}
                  title="Signature preview"
                />
              </div>
            </div>
          )}
        </div>
        <TokenSidebar onInsert={handleInsertToken} />
      </div>
    </div>
  )
}

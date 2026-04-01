'use client'

import { useState, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import FontFamily from '@tiptap/extension-font-family'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { EditorToolbar } from './EditorToolbar'
import { TokenSidebar } from './TokenSidebar'
import { SignaturePreview } from './SignaturePreview'
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
  const [tab, setTab] = useState<'design' | 'source'>('design')
  const [sourceHtml, setSourceHtml] = useState(signature.html_template ?? '')

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      FontFamily,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
      Image,
    ],
    content: signature.html_template ?? '',
    onUpdate: ({ editor: e }) => setSourceHtml(e.getHTML()),
  })

  const currentHtml = tab === 'source' ? sourceHtml : (editor?.getHTML() ?? '')

  const handleSave = useCallback(async () => {
    if (!name.trim()) return
    setSaving(true)
    await onSave({ name: name.trim(), html: currentHtml, status, isDefault })
    setSaving(false)
  }, [name, currentHtml, status, isDefault, onSave])

  const handleInsertToken = useCallback((token: string) => {
    if (tab === 'source') {
      setSourceHtml(prev => prev + token)
    } else {
      editor?.chain().focus().insertContent(token).run()
    }
  }, [editor, tab])

  const handleSourceChange = useCallback((html: string) => {
    setSourceHtml(html)
    editor?.commands.setContent(html, { emitUpdate: false })
  }, [editor])

  const handleTabSwitch = useCallback((t: 'design' | 'source') => {
    if (t === 'source') setSourceHtml(editor?.getHTML() ?? '')
    else if (editor) editor.commands.setContent(sourceHtml, { emitUpdate: false })
    setTab(t)
  }, [editor, sourceHtml])

  const selectStyle: React.CSSProperties = {
    background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)',
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 shrink-0" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <input type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder="Signature name..." className="flex-1 text-sm font-medium bg-transparent outline-none"
          style={{ color: 'var(--text)' }} />
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

      {/* Editor body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          {/* Design / Source tabs */}
          <div className="flex items-center gap-0.5 px-3 py-1.5 shrink-0" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
            {(['design', 'source'] as const).map(t => (
              <button key={t} onClick={() => handleTabSwitch(t)}
                className="px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors"
                style={{ background: tab === t ? 'var(--surface-3)' : 'transparent', color: tab === t ? 'var(--text)' : 'var(--text-muted)' }}>
                {t}
              </button>
            ))}
            {isNew && (
              <span className="ml-3 text-[11px]" style={{ color: 'var(--text-dim)' }}>
                Tip: To paste an existing HTML signature, use the Source tab
              </span>
            )}
          </div>

          {tab === 'design' ? (
            <>
              <EditorToolbar editor={editor} />
              <div className="flex-1 overflow-auto" style={{ background: '#ffffff' }}>
                <EditorContent editor={editor} className="tiptap-editor p-4 min-h-[200px] outline-none"
                  style={{ color: '#000', fontSize: 14, fontFamily: 'Arial, sans-serif' }} />
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-auto p-0">
              <textarea value={sourceHtml} onChange={e => handleSourceChange(e.target.value)}
                placeholder="Paste your HTML signature here, or use the Design tab to build from scratch"
                className="w-full h-full p-4 text-xs font-mono outline-none resize-none"
                style={{ background: 'var(--surface-2)', color: 'var(--text)', border: 'none' }}
                spellCheck={false} />
            </div>
          )}
        </div>
        <TokenSidebar onInsert={handleInsertToken} />
      </div>

      {/* Inline preview */}
      <div className="shrink-0">
        <SignaturePreview html={currentHtml} />
      </div>
    </div>
  )
}

'use client'

import type { Editor } from '@tiptap/react'
import {
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Image, Link2, RemoveFormatting, Indent, Outdent,
} from 'lucide-react'

interface EditorToolbarProps {
  editor: Editor | null
}

const FONTS = ['Arial', 'Helvetica', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana']
const SIZES = ['12px', '13px', '14px', '16px', '18px', '20px', '24px']

function ToolBtn({ active, onClick, children, title }: {
  active?: boolean; onClick: () => void; children: React.ReactNode; title?: string
}) {
  return (
    <button onClick={onClick} title={title}
      className="p-1.5 rounded transition-colors"
      style={{ background: active ? 'var(--surface-3)' : 'transparent', color: active ? 'var(--text)' : 'var(--text-muted)' }}>
      {children}
    </button>
  )
}

function Sep() {
  return <div className="w-px h-5 mx-1" style={{ background: 'var(--border)' }} />
}

const selectStyle: React.CSSProperties = {
  background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)',
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) return null

  const insertImage = () => {
    const url = prompt('Image URL:')
    if (url) editor.chain().focus().setImage({ src: url }).run()
  }

  const insertLink = () => {
    const url = prompt('Link URL:', 'https://')
    if (url) editor.chain().focus().setLink({ href: url, target: '_blank' }).run()
  }

  return (
    <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
      {/* Row 1 */}
      <div className="flex items-center gap-0.5 px-3 py-1.5 flex-wrap">
        <select onChange={e => editor.chain().focus().setFontFamily(e.target.value).run()}
          className="text-xs rounded px-1.5 py-1 outline-none mr-1" style={selectStyle}>
          {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <select onChange={e => editor.chain().focus().setMark('textStyle', { fontSize: e.target.value }).run()}
          className="text-xs rounded px-1.5 py-1 outline-none mr-1" style={selectStyle}>
          {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <ToolBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">
          <Bold className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">
          <Italic className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline">
          <Underline className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough">
          <Strikethrough className="w-3.5 h-3.5" />
        </ToolBtn>
        <Sep />
        <ToolBtn active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
          <AlignLeft className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
          <AlignCenter className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
          <AlignRight className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()}>
          <AlignJustify className="w-3.5 h-3.5" />
        </ToolBtn>
        <Sep />
        <ToolBtn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="w-3.5 h-3.5" />
        </ToolBtn>
      </div>
      {/* Row 2 */}
      <div className="flex items-center gap-0.5 px-3 py-1.5 flex-wrap" style={{ borderTop: '1px solid var(--border)' }}>
        <label className="flex items-center gap-1 text-xs px-1" style={{ color: 'var(--text-muted)' }} title="Text Color">
          A
          <input type="color" className="w-5 h-5 cursor-pointer border-0 p-0 bg-transparent"
            onChange={e => editor.chain().focus().setColor(e.target.value).run()} defaultValue="#000000" />
        </label>
        <label className="flex items-center gap-1 text-xs px-1" style={{ color: 'var(--text-muted)' }} title="Background">
          BG
          <input type="color" className="w-5 h-5 cursor-pointer border-0 p-0 bg-transparent"
            onChange={e => editor.chain().focus().setMark('textStyle', { backgroundColor: e.target.value }).run()} defaultValue="#ffffff" />
        </label>
        <Sep />
        <ToolBtn onClick={() => editor.chain().focus().sinkListItem('listItem').run()} title="Indent">
          <Indent className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().liftListItem('listItem').run()} title="Outdent">
          <Outdent className="w-3.5 h-3.5" />
        </ToolBtn>
        <Sep />
        <ToolBtn onClick={insertImage} title="Insert Image"><Image className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn active={editor.isActive('link')} onClick={insertLink} title="Insert Link"><Link2 className="w-3.5 h-3.5" /></ToolBtn>
        <Sep />
        <ToolBtn onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="Remove Formatting">
          <RemoveFormatting className="w-3.5 h-3.5" />
        </ToolBtn>
      </div>
    </div>
  )
}

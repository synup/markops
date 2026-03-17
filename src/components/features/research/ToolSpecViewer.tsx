'use client'

import { Component, type ReactNode } from 'react'

interface ToolSpec {
  tool_name?: string
  description?: string
  features?: string[]
  file_structure?: string[] | string
  code_outline?: string
  build_instructions?: string[] | string
  claude_code_prompt?: string
  [key: string]: unknown
}

interface ToolSpecViewerProps {
  notes: string
  onClose: () => void
}

// ── Error Boundary ──────────────────────────────────

interface EBState { error: string | null }

class SpecErrorBoundary extends Component<{ notes: string; onClose: () => void; children: ReactNode }, EBState> {
  state: EBState = { error: null }
  static getDerivedStateFromError(err: Error) { return { error: err.message } }
  render() {
    if (this.state.error) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="relative mx-4 flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--red)' }}>Spec Render Error</h2>
              <button onClick={this.props.onClose} className="text-xs" style={{ color: 'var(--text-muted)' }}>✕ Close</button>
            </div>
            <div className="overflow-y-auto p-5">
              <p className="mb-3 text-xs" style={{ color: 'var(--red)' }}>{this.state.error}</p>
              <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg p-3 text-[11px] leading-relaxed" style={{ background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>{this.props.notes}</pre>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ── Markdown Generator ──────────────────────────────

function specToMarkdown(spec: ToolSpec): string {
  const lines: string[] = []
  lines.push(`# ${spec.tool_name || 'Tool Spec'}`, '')
  if (spec.description) { lines.push('## Description', '', spec.description, '') }
  if (spec.features) {
    lines.push('## Features', '')
    toArray(spec.features).forEach(f => lines.push(`- ${f}`))
    lines.push('')
  }
  if (spec.file_structure) { lines.push('## File Structure', '', '```', toStr(spec.file_structure), '```', '') }
  if (spec.code_outline) { lines.push('## Code Outline', '', '```', spec.code_outline, '```', '') }
  if (spec.build_instructions) {
    lines.push('## Build Instructions', '')
    toArray(spec.build_instructions).forEach((s, i) => lines.push(`${i + 1}. ${s}`))
    lines.push('')
  }
  if (spec.claude_code_prompt) { lines.push('## Claude Code Prompt', '', '```', spec.claude_code_prompt, '```', '') }
  const skip = new Set(['tool_name', 'description', 'features', 'file_structure', 'code_outline', 'build_instructions', 'claude_code_prompt'])
  Object.entries(spec).filter(([k]) => !skip.has(k)).forEach(([key, val]) => {
    const title = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    const content = typeof val === 'string' ? val : JSON.stringify(val, null, 2)
    lines.push(`## ${title}`, '', content, '')
  })
  return lines.join('\n')
}

// ── Download helper ─────────────────────────────────

export function downloadSpecMarkdown(notes: string) {
  let spec: ToolSpec
  try {
    const parsed = JSON.parse(notes)
    spec = (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : { description: notes }
  } catch { spec = { description: notes } }
  const slug = (spec.tool_name || 'tool').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const md = specToMarkdown(spec)
  const blob = new Blob([md], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = `${slug}-spec.md`; a.click()
  URL.revokeObjectURL(url)
}

// ── Main Component ──────────────────────────────────

export function ToolSpecViewer({ notes, onClose }: ToolSpecViewerProps) {
  return (
    <SpecErrorBoundary notes={notes} onClose={onClose}>
      <ToolSpecViewerInner notes={notes} onClose={onClose} />
    </SpecErrorBoundary>
  )
}

function ToolSpecViewerInner({ notes, onClose }: ToolSpecViewerProps) {
  console.log('[ToolSpecViewer] raw notes:', notes)

  let spec: ToolSpec | null = null
  let parseError = false
  try {
    const parsed = JSON.parse(notes)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      spec = parsed
    } else {
      parseError = true
    }
  } catch {
    parseError = true
  }

  console.log('[ToolSpecViewer] parsed result:', spec, 'parseError:', parseError)

  // Raw text fallback
  if (parseError || !spec) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
        <div className="relative mx-4 flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: 'var(--border)' }}>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Tool Spec</h2>
            <button onClick={onClose} className="text-xs" style={{ color: 'var(--text-muted)' }}>✕ Close</button>
          </div>
          <div className="overflow-y-auto p-5">
            <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg p-3 text-xs leading-relaxed" style={{ background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>{notes}</pre>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="relative mx-4 flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              {spec.tool_name || 'Tool Spec'}
            </h2>
            <button
              onClick={() => downloadSpecMarkdown(notes)}
              className="btn-research rounded px-2 py-0.5 text-[10px] font-medium"
              style={{ background: 'var(--surface-2)', color: 'var(--brand)', border: '1px solid var(--brand-border)' }}
            >
              Download Spec
            </button>
          </div>
          <button onClick={onClose} className="text-xs" style={{ color: 'var(--text-muted)' }}>✕ Close</button>
        </div>
        <div className="overflow-y-auto p-5">
          <div className="flex flex-col gap-4">
            {spec.description && <Section title="Description" content={String(spec.description)} />}
            {spec.features && <ListSection title="Features" items={toArray(spec.features)} />}
            {spec.file_structure && <CodeSection title="File Structure" content={toStr(spec.file_structure)} />}
            {spec.code_outline && <CodeSection title="Code Outline" content={String(spec.code_outline)} />}
            {spec.build_instructions && <ListSection title="Build Instructions" items={toArray(spec.build_instructions)} />}
            {spec.claude_code_prompt && <CodeSection title="Claude Code Prompt" content={String(spec.claude_code_prompt)} />}
            <ExtraFields spec={spec} />
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--brand)' }}>{title}</h3>
      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{content}</p>
    </div>
  )
}

function ListSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--brand)' }}>{title}</h3>
      <ul className="flex flex-col gap-1">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span style={{ color: 'var(--text-dim)' }}>•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function CodeSection({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--brand)' }}>{title}</h3>
      <pre
        className="overflow-x-auto whitespace-pre-wrap rounded-lg p-3 text-[11px] leading-relaxed"
        style={{ background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
      >{content}</pre>
    </div>
  )
}

function ExtraFields({ spec }: { spec: ToolSpec }) {
  const skip = new Set(['tool_name', 'description', 'features', 'file_structure', 'code_outline', 'build_instructions', 'claude_code_prompt'])
  const extra = Object.entries(spec).filter(([k]) => !skip.has(k))
  if (!extra.length) return null
  return (
    <>
      {extra.map(([key, val]) => (
        <Section key={key} title={key.replace(/_/g, ' ')} content={typeof val === 'string' ? val : JSON.stringify(val, null, 2)} />
      ))}
    </>
  )
}

function toArray(v: string[] | string | unknown): string[] {
  if (Array.isArray(v)) return v.map(String)
  if (typeof v === 'string') return v.split('\n').filter(Boolean)
  return [String(v)]
}

function toStr(v: string[] | string | unknown): string {
  if (Array.isArray(v)) return v.join('\n')
  return String(v)
}

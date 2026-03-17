'use client'

import { Component, type ReactNode } from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyVal = any

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
        <Modal onClose={this.props.onClose} title="Spec Render Error" titleColor="#EF4444">
          <p className="mb-3 text-sm" style={{ color: '#EF4444' }}>{this.state.error}</p>
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg p-4 text-[13px] leading-relaxed" style={{ background: '#111', color: '#D1D5DB', border: '1px solid #333' }}>{this.props.notes}</pre>
        </Modal>
      )
    }
    return this.props.children
  }
}

// ── Modal Shell ─────────────────────────────────────

function Modal({ onClose, title, titleColor, download, children }: {
  onClose: () => void; title: string; titleColor?: string; download?: () => void; children: ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div
        className="relative mx-4 flex max-h-[85vh] w-full flex-col rounded-xl"
        style={{ background: '#1A1A1A', border: '1px solid #333', maxWidth: 800 }}
      >
        <div className="flex items-center justify-between border-b px-8 py-4" style={{ borderColor: '#333' }}>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold" style={{ color: titleColor || '#fff' }}>{title}</h2>
            {download && (
              <button onClick={download} className="btn-research rounded px-2.5 py-1 text-[11px] font-medium" style={{ background: '#2D2D2D', color: '#C4B5FD', border: '1px solid #4C3D99' }}>
                Download Spec
              </button>
            )}
          </div>
          <button onClick={onClose} className="btn-research rounded px-2 py-1 text-xs font-medium" style={{ color: '#9CA3AF' }}>✕ Close</button>
        </div>
        <div className="overflow-y-auto" style={{ padding: 32 }}>
          {children}
        </div>
      </div>
    </div>
  )
}

// ── Markdown Generator ──────────────────────────────

function specToMarkdown(spec: Record<string, AnyVal>): string {
  const lines: string[] = []
  lines.push(`# ${spec.tool_name || 'Tool Spec'}`, '')
  if (spec.description) lines.push('## Description', '', stringify(spec.description), '')
  if (spec.features) {
    lines.push('## Features', '')
    smartArray(spec.features).forEach(f => {
      if (typeof f === 'object' && f !== null) {
        lines.push(`- **${f.feature || f.name || 'Feature'}**: ${f.description || ''}${f.priority ? ` _(${f.priority})_` : ''}`)
      } else lines.push(`- ${String(f)}`)
    })
    lines.push('')
  }
  if (spec.file_structure) {
    lines.push('## File Structure', '')
    if (typeof spec.file_structure === 'object' && !Array.isArray(spec.file_structure)) {
      Object.entries(spec.file_structure).forEach(([k, v]) => lines.push(`- \`${k}\` — ${stringify(v)}`))
    } else lines.push('```', stringify(spec.file_structure), '```')
    lines.push('')
  }
  if (spec.code_outline) lines.push('## Code Outline', '', '```', stringify(spec.code_outline), '```', '')
  if (spec.build_instructions) {
    lines.push('## Build Instructions', '')
    smartArray(spec.build_instructions).forEach((s, i) => lines.push(`${i + 1}. ${stringify(s)}`))
    lines.push('')
  }
  if (spec.claude_code_prompt) lines.push('## Claude Code Prompt', '', '```', stringify(spec.claude_code_prompt), '```', '')
  const skip = new Set(['tool_name', 'description', 'features', 'file_structure', 'code_outline', 'build_instructions', 'claude_code_prompt'])
  Object.entries(spec).filter(([k]) => !skip.has(k)).forEach(([key, val]) => {
    lines.push(`## ${humanize(key)}`, '', stringify(val), '')
  })
  return lines.join('\n')
}

export function downloadSpecMarkdown(notes: string) {
  const spec = safeParse(notes)
  const slug = slugify(spec.tool_name || 'tool')
  const blob = new Blob([specToMarkdown(spec)], { type: 'text/markdown' })
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
  const spec = safeParse(notes)
  console.log('[ToolSpecViewer] parsed:', spec)

  // Raw text fallback — if it parsed but has no known keys, show raw
  const knownKeys = ['tool_name', 'description', 'features', 'file_structure', 'code_outline', 'build_instructions', 'claude_code_prompt']
  const hasStructure = knownKeys.some(k => k in spec)

  if (!hasStructure && Object.keys(spec).length <= 1) {
    return (
      <Modal onClose={onClose} title="Tool Spec">
        <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg p-4 text-sm leading-relaxed" style={{ background: '#111', color: '#E5E7EB', border: '1px solid #333' }}>{notes}</pre>
      </Modal>
    )
  }

  return (
    <Modal onClose={onClose} title={stringify(spec.tool_name) || 'Tool Spec'} download={() => downloadSpecMarkdown(notes)}>
      <div className="flex flex-col gap-6">
        {spec.description && <TextSection title="Description" content={stringify(spec.description)} />}
        {spec.features && <FeaturesSection items={smartArray(spec.features)} />}
        {spec.file_structure && <FileStructureSection data={spec.file_structure} />}
        {spec.code_outline && <CodeSection title="Code Outline" content={stringify(spec.code_outline)} />}
        {spec.build_instructions && <SmartListSection title="Build Instructions" items={smartArray(spec.build_instructions)} />}
        {spec.claude_code_prompt && <CodeSection title="Claude Code Prompt" content={stringify(spec.claude_code_prompt)} />}
        <ExtraFields data={spec} skip={['tool_name', 'description', 'features', 'file_structure', 'code_outline', 'build_instructions', 'claude_code_prompt']} />
      </div>
    </Modal>
  )
}

// ── Section Components ──────────────────────────────

function SectionHeader({ children }: { children: ReactNode }) {
  return <h3 className="mb-2 text-base font-semibold uppercase tracking-wide" style={{ color: '#C4B5FD' }}>{children}</h3>
}

function TextSection({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <SectionHeader>{title}</SectionHeader>
      <p className="text-sm leading-[1.7]" style={{ color: '#F3F4F6' }}>{content}</p>
    </div>
  )
}

function FeaturesSection({ items }: { items: AnyVal[] }) {
  return (
    <div>
      <SectionHeader>Features</SectionHeader>
      <div className="flex flex-col gap-2">
        {items.map((item, i) => {
          if (typeof item === 'object' && item !== null) {
            const name = item.feature || item.name || `Feature ${i + 1}`
            const desc = item.description || item.desc || ''
            const priority = item.priority
            return (
              <div key={i} className="rounded-lg p-3" style={{ background: '#222', border: '1px solid #333' }}>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold" style={{ color: '#F3F4F6' }}>{stringify(name)}</span>
                  {priority && (
                    <span className="rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ background: '#3B1F7E', color: '#C4B5FD' }}>{stringify(priority)}</span>
                  )}
                </div>
                {desc && <p className="mt-1 text-sm leading-[1.6]" style={{ color: '#D1D5DB' }}>{stringify(desc)}</p>}
              </div>
            )
          }
          return (
            <div key={i} className="flex gap-2 text-sm" style={{ color: '#F3F4F6' }}>
              <span style={{ color: '#C4B5FD' }}>•</span><span>{stringify(item)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FileStructureSection({ data }: { data: AnyVal }) {
  return (
    <div>
      <SectionHeader>File Structure</SectionHeader>
      {typeof data === 'object' && data !== null && !Array.isArray(data) ? (
        <div className="flex flex-col gap-1">
          {Object.entries(data).map(([path, desc]) => (
            <div key={path} className="flex items-baseline gap-3 text-sm">
              <code className="shrink-0 rounded px-1.5 py-0.5 text-[13px]" style={{ background: '#222', color: '#C4B5FD', fontFamily: 'monospace' }}>{path}</code>
              <span style={{ color: '#D1D5DB' }}>{stringify(desc)}</span>
            </div>
          ))}
        </div>
      ) : Array.isArray(data) ? (
        <div className="flex flex-col gap-1">
          {data.map((item, i) => {
            if (typeof item === 'object' && item !== null) {
              const path = item.path || item.file || item.name || `file_${i}`
              const desc = item.description || item.purpose || ''
              return (
                <div key={i} className="flex items-baseline gap-3 text-sm">
                  <code className="shrink-0 rounded px-1.5 py-0.5 text-[13px]" style={{ background: '#222', color: '#C4B5FD', fontFamily: 'monospace' }}>{stringify(path)}</code>
                  {desc && <span style={{ color: '#D1D5DB' }}>{stringify(desc)}</span>}
                </div>
              )
            }
            return (
              <div key={i} className="text-sm" style={{ color: '#F3F4F6' }}>
                <code style={{ fontFamily: 'monospace', color: '#C4B5FD' }}>{stringify(item)}</code>
              </div>
            )
          })}
        </div>
      ) : (
        <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg p-4 text-[13px] leading-relaxed" style={{ background: '#111', color: '#D1D5DB', border: '1px solid #333', fontFamily: 'monospace' }}>{stringify(data)}</pre>
      )}
    </div>
  )
}

function CodeSection({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <SectionHeader>{title}</SectionHeader>
      <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg p-4 text-[13px] leading-relaxed" style={{ background: '#111', color: '#D1D5DB', border: '1px solid #333', fontFamily: 'monospace' }}>{content}</pre>
    </div>
  )
}

function SmartListSection({ title, items }: { title: string; items: AnyVal[] }) {
  return (
    <div>
      <SectionHeader>{title}</SectionHeader>
      <ol className="flex flex-col gap-1 pl-1">
        {items.map((item, i) => (
          <li key={i} className="text-sm leading-[1.6]" style={{ color: '#F3F4F6' }}>
            <span style={{ color: '#C4B5FD', marginRight: 8 }}>{i + 1}.</span>
            {stringify(item)}
          </li>
        ))}
      </ol>
    </div>
  )
}

function ExtraFields({ data, skip }: { data: Record<string, AnyVal>; skip: string[] }) {
  const skipSet = new Set(skip)
  const extra = Object.entries(data).filter(([k]) => !skipSet.has(k))
  if (!extra.length) return null
  return (
    <>
      {extra.map(([key, val]) => {
        if (Array.isArray(val)) {
          return <SmartListSection key={key} title={humanize(key)} items={val} />
        }
        if (typeof val === 'object' && val !== null) {
          return <ObjectSection key={key} title={humanize(key)} data={val} />
        }
        return <TextSection key={key} title={humanize(key)} content={stringify(val)} />
      })}
    </>
  )
}

function ObjectSection({ title, data }: { title: string; data: Record<string, AnyVal> }) {
  return (
    <div>
      <SectionHeader>{title}</SectionHeader>
      <div className="flex flex-col gap-1">
        {Object.entries(data).map(([k, v]) => (
          <div key={k} className="text-sm leading-[1.6]">
            <span className="font-semibold" style={{ color: '#E5E7EB' }}>{humanize(k)}:</span>{' '}
            <span style={{ color: '#D1D5DB' }}>{stringify(v)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Utilities ────────────────────────────────────────

function safeParse(notes: string): Record<string, AnyVal> {
  try {
    const p = JSON.parse(notes)
    if (p && typeof p === 'object' && !Array.isArray(p)) return p
    return { _raw: notes }
  } catch { return { _raw: notes } }
}

function stringify(v: AnyVal): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  return JSON.stringify(v, null, 2)
}

function smartArray(v: AnyVal): AnyVal[] {
  if (Array.isArray(v)) return v
  if (typeof v === 'string') return v.split('\n').filter(Boolean)
  return [v]
}

function humanize(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

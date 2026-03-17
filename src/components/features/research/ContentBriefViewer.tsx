'use client'

import { Component, useState, type ReactNode } from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyVal = any

interface ContentBriefViewerProps {
  notes: string
  onClose: () => void
}

// ── Error Boundary ──────────────────────────────────

interface EBState { error: string | null }

class BriefErrorBoundary extends Component<{ notes: string; onClose: () => void; children: ReactNode }, EBState> {
  state: EBState = { error: null }
  static getDerivedStateFromError(err: Error) { return { error: err.message } }
  render() {
    if (this.state.error) {
      return (
        <Modal onClose={this.props.onClose} title="Brief Render Error" titleColor="#EF4444">
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
              <button onClick={download} className="btn-research rounded px-2.5 py-1 text-[11px] font-medium" style={{ background: '#2D2D2D', color: '#93C5FD', border: '1px solid #1E40AF' }}>
                Download Brief
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

function briefToMarkdown(brief: Record<string, AnyVal>): string {
  const lines: string[] = []
  lines.push(`# ${brief.topic || 'Content Brief'}`, '')
  if (brief.angle) lines.push('## Angle', '', stringify(brief.angle), '')
  if (brief.target_audience) lines.push('## Target Audience', '', stringify(brief.target_audience), '')
  if (brief.channels && Array.isArray(brief.channels)) {
    lines.push('## Channels', '')
    brief.channels.forEach((ch: AnyVal) => {
      if (typeof ch === 'object' && ch !== null) {
        lines.push(`### ${ch.channel || 'Channel'}`)
        if (ch.format || ch.word_count) {
          lines.push('', '| Property | Value |', '|----------|-------|')
          if (ch.format) lines.push(`| Format | ${ch.format} |`)
          if (ch.word_count) lines.push(`| Word Count | ${ch.word_count} |`)
        }
        if (ch.brief) lines.push('', ch.brief)
        lines.push('')
      } else lines.push(`- ${stringify(ch)}`)
    })
    lines.push('')
  }
  if (brief.distribution_timeline) {
    lines.push('## Distribution Timeline', '')
    smartArray(brief.distribution_timeline).forEach((s: AnyVal) => lines.push(`- ${stringify(s)}`))
    lines.push('')
  }
  if (brief.success_metrics) {
    lines.push('## Success Metrics', '')
    smartArray(brief.success_metrics).forEach((s: AnyVal) => lines.push(`- ${stringify(s)}`))
    lines.push('')
  }
  const skip = new Set(['topic', 'angle', 'target_audience', 'channels', 'distribution_timeline', 'success_metrics'])
  Object.entries(brief).filter(([k]) => !skip.has(k)).forEach(([key, val]) => {
    lines.push(`## ${humanize(key)}`, '', stringify(val), '')
  })
  return lines.join('\n')
}

export function downloadBriefMarkdown(notes: string) {
  const brief = safeParse(notes)
  const slug = slugify(brief.topic || 'brief')
  const blob = new Blob([briefToMarkdown(brief)], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = `${slug}-brief.md`; a.click()
  URL.revokeObjectURL(url)
}

// ── Main Component ──────────────────────────────────

export function ContentBriefViewer({ notes, onClose }: ContentBriefViewerProps) {
  return (
    <BriefErrorBoundary notes={notes} onClose={onClose}>
      <ContentBriefViewerInner notes={notes} onClose={onClose} />
    </BriefErrorBoundary>
  )
}

function ContentBriefViewerInner({ notes, onClose }: ContentBriefViewerProps) {
  console.log('[ContentBriefViewer] raw notes:', notes)
  const brief = safeParse(notes)
  console.log('[ContentBriefViewer] parsed:', brief)

  const knownKeys = ['topic', 'angle', 'target_audience', 'channels', 'distribution_timeline', 'success_metrics']
  const hasStructure = knownKeys.some(k => k in brief)

  if (!hasStructure && Object.keys(brief).length <= 1) {
    return (
      <Modal onClose={onClose} title="Content Brief">
        <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg p-4 text-sm leading-relaxed" style={{ background: '#111', color: '#E5E7EB', border: '1px solid #333' }}>{notes}</pre>
      </Modal>
    )
  }

  return (
    <Modal onClose={onClose} title={stringify(brief.topic) || 'Content Brief'} download={() => downloadBriefMarkdown(notes)}>
      <div className="flex flex-col gap-6">
        {brief.angle && <TextSection title="Angle" content={stringify(brief.angle)} />}
        {brief.target_audience && <TextSection title="Target Audience" content={stringify(brief.target_audience)} />}
        {brief.channels && Array.isArray(brief.channels) && brief.channels.length > 0 && <ChannelsList channels={brief.channels} />}
        {brief.distribution_timeline && <SmartListSection title="Distribution Timeline" items={smartArray(brief.distribution_timeline)} />}
        {brief.success_metrics && <SmartListSection title="Success Metrics" items={smartArray(brief.success_metrics)} />}
        <ExtraFields data={brief} skip={['topic', 'angle', 'target_audience', 'channels', 'distribution_timeline', 'success_metrics']} />
      </div>
    </Modal>
  )
}

// ── Section Components ──────────────────────────────

function SectionHeader({ children }: { children: ReactNode }) {
  return <h3 className="mb-2 text-base font-semibold uppercase tracking-wide" style={{ color: '#93C5FD' }}>{children}</h3>
}

function TextSection({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <SectionHeader>{title}</SectionHeader>
      <p className="text-sm leading-[1.7]" style={{ color: '#F3F4F6' }}>{content}</p>
    </div>
  )
}

function SmartListSection({ title, items }: { title: string; items: AnyVal[] }) {
  return (
    <div>
      <SectionHeader>{title}</SectionHeader>
      <ul className="flex flex-col gap-1 pl-1">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm leading-[1.6]" style={{ color: '#F3F4F6' }}>
            <span style={{ color: '#93C5FD' }}>•</span>
            <span>{stringify(item)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ChannelsList({ channels }: { channels: AnyVal[] }) {
  return (
    <div>
      <SectionHeader>Channels</SectionHeader>
      <div className="flex flex-col gap-2">
        {channels.map((ch, i) => {
          if (typeof ch === 'object' && ch !== null) {
            return <CollapsibleChannel key={i} channel={ch} />
          }
          return <div key={i} className="text-sm" style={{ color: '#F3F4F6' }}>{stringify(ch)}</div>
        })}
      </div>
    </div>
  )
}

function CollapsibleChannel({ channel }: { channel: Record<string, AnyVal> }) {
  const [open, setOpen] = useState(false)
  const name = channel.channel || channel.name || 'Channel'
  return (
    <div className="rounded-lg" style={{ background: '#222', border: '1px solid #333' }}>
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-4 py-2.5 text-left">
        <span className="text-sm font-semibold" style={{ color: '#F3F4F6' }}>{stringify(name)}</span>
        <div className="flex items-center gap-3">
          {channel.format && <span className="text-xs" style={{ color: '#9CA3AF' }}>{stringify(channel.format)}</span>}
          {channel.word_count && <span className="text-xs" style={{ color: '#9CA3AF' }}>{channel.word_count}w</span>}
          <span className="text-xs" style={{ color: '#9CA3AF' }}>{open ? '▾' : '▸'}</span>
        </div>
      </button>
      {open && (
        <div className="border-t px-4 py-3" style={{ borderColor: '#333' }}>
          {channel.brief ? (
            <p className="whitespace-pre-wrap text-sm leading-[1.7]" style={{ color: '#D1D5DB' }}>{stringify(channel.brief)}</p>
          ) : (
            <p className="text-sm" style={{ color: '#6B7280' }}>No brief content</p>
          )}
          {/* Render any extra channel fields */}
          {Object.entries(channel).filter(([k]) => !['channel', 'name', 'brief', 'format', 'word_count'].includes(k)).map(([k, v]) => (
            <div key={k} className="mt-2 text-sm">
              <span className="font-semibold" style={{ color: '#E5E7EB' }}>{humanize(k)}:</span>{' '}
              <span style={{ color: '#D1D5DB' }}>{stringify(v)}</span>
            </div>
          ))}
        </div>
      )}
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
        if (Array.isArray(val)) return <SmartListSection key={key} title={humanize(key)} items={val} />
        if (typeof val === 'object' && val !== null) return <ObjectSection key={key} title={humanize(key)} data={val} />
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

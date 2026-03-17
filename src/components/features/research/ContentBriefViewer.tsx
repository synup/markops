'use client'

import { Component, useState, type ReactNode } from 'react'

interface ChannelBrief {
  channel?: string
  brief?: string
  format?: string
  word_count?: number
  [key: string]: unknown
}

interface ContentBrief {
  topic?: string
  angle?: string
  target_audience?: string
  channels?: ChannelBrief[]
  distribution_timeline?: string[] | string
  success_metrics?: string[] | string
  [key: string]: unknown
}

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
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="relative mx-4 flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--red)' }}>Brief Render Error</h2>
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

function briefToMarkdown(brief: ContentBrief): string {
  const lines: string[] = []
  lines.push(`# ${brief.topic || 'Content Brief'}`, '')
  if (brief.angle) { lines.push('## Angle', '', brief.angle, '') }
  if (brief.target_audience) { lines.push('## Target Audience', '', brief.target_audience, '') }
  if (brief.channels && brief.channels.length > 0) {
    lines.push('## Channels', '')
    brief.channels.forEach(ch => {
      lines.push(`### ${ch.channel || 'Channel'}`)
      if (ch.format || ch.word_count) {
        lines.push('')
        lines.push('| Property | Value |')
        lines.push('|----------|-------|')
        if (ch.format) lines.push(`| Format | ${ch.format} |`)
        if (ch.word_count) lines.push(`| Word Count | ${ch.word_count} |`)
      }
      if (ch.brief) { lines.push('', ch.brief) }
      lines.push('')
    })
  }
  if (brief.distribution_timeline) {
    lines.push('## Distribution Timeline', '')
    toArray(brief.distribution_timeline).forEach(s => lines.push(`- ${s}`))
    lines.push('')
  }
  if (brief.success_metrics) {
    lines.push('## Success Metrics', '')
    toArray(brief.success_metrics).forEach(s => lines.push(`- ${s}`))
    lines.push('')
  }
  const skip = new Set(['topic', 'angle', 'target_audience', 'channels', 'distribution_timeline', 'success_metrics'])
  Object.entries(brief).filter(([k]) => !skip.has(k)).forEach(([key, val]) => {
    const title = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    const content = typeof val === 'string' ? val : JSON.stringify(val, null, 2)
    lines.push(`## ${title}`, '', content, '')
  })
  return lines.join('\n')
}

// ── Download helper ─────────────────────────────────

export function downloadBriefMarkdown(notes: string) {
  let brief: ContentBrief
  try {
    const parsed = JSON.parse(notes)
    brief = (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : { topic: notes }
  } catch { brief = { topic: notes } }
  const slug = (brief.topic || 'brief').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const md = briefToMarkdown(brief)
  const blob = new Blob([md], { type: 'text/markdown' })
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

  let brief: ContentBrief | null = null
  let parseError = false
  try {
    const parsed = JSON.parse(notes)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      brief = parsed
    } else {
      parseError = true
    }
  } catch {
    parseError = true
  }

  console.log('[ContentBriefViewer] parsed result:', brief, 'parseError:', parseError)

  // Raw text fallback
  if (parseError || !brief) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
        <div className="relative mx-4 flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: 'var(--border)' }}>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Content Brief</h2>
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
              {brief.topic || 'Content Brief'}
            </h2>
            <button
              onClick={() => downloadBriefMarkdown(notes)}
              className="btn-research rounded px-2 py-0.5 text-[10px] font-medium"
              style={{ background: 'var(--surface-2)', color: 'var(--brand)', border: '1px solid var(--brand-border)' }}
            >
              Download Brief
            </button>
          </div>
          <button onClick={onClose} className="text-xs" style={{ color: 'var(--text-muted)' }}>✕ Close</button>
        </div>
        <div className="overflow-y-auto p-5">
          <div className="flex flex-col gap-4">
            {brief.angle && <Field title="Angle" value={String(brief.angle)} />}
            {brief.target_audience && <Field title="Target Audience" value={String(brief.target_audience)} />}
            {brief.channels && Array.isArray(brief.channels) && brief.channels.length > 0 && <ChannelsList channels={brief.channels} />}
            {brief.distribution_timeline && <ListField title="Distribution Timeline" items={toArray(brief.distribution_timeline)} />}
            {brief.success_metrics && <ListField title="Success Metrics" items={toArray(brief.success_metrics)} />}
            <ExtraFields brief={brief} />
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ title, value }: { title: string; value: string }) {
  return (
    <div>
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--blue)' }}>{title}</h3>
      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{value}</p>
    </div>
  )
}

function ListField({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--blue)' }}>{title}</h3>
      <ul className="flex flex-col gap-1">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span style={{ color: 'var(--text-dim)' }}>•</span><span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ChannelsList({ channels }: { channels: ChannelBrief[] }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--blue)' }}>Channels</h3>
      <div className="flex flex-col gap-1.5">
        {channels.map((ch, i) => <CollapsibleChannel key={i} channel={ch} />)}
      </div>
    </div>
  )
}

function CollapsibleChannel({ channel }: { channel: ChannelBrief }) {
  const [open, setOpen] = useState(false)
  const name = channel.channel || 'Channel'
  return (
    <div className="rounded-lg" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-3 py-2 text-left">
        <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>{name}</span>
        <div className="flex items-center gap-2">
          {channel.format && <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>{channel.format}</span>}
          {channel.word_count && <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>{channel.word_count}w</span>}
          <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>{open ? '▾' : '▸'}</span>
        </div>
      </button>
      {open && (
        <div className="border-t px-3 py-2" style={{ borderColor: 'var(--border)' }}>
          {channel.brief ? (
            <p className="whitespace-pre-wrap text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{channel.brief}</p>
          ) : (
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>No brief content</p>
          )}
        </div>
      )}
    </div>
  )
}

function ExtraFields({ brief }: { brief: ContentBrief }) {
  const skip = new Set(['topic', 'angle', 'target_audience', 'channels', 'distribution_timeline', 'success_metrics'])
  const extra = Object.entries(brief).filter(([k]) => !skip.has(k))
  if (!extra.length) return null
  return (
    <>
      {extra.map(([key, val]) => (
        <Field key={key} title={key.replace(/_/g, ' ')} value={typeof val === 'string' ? val : JSON.stringify(val, null, 2)} />
      ))}
    </>
  )
}

function toArray(v: string[] | string | unknown): string[] {
  if (Array.isArray(v)) return v.map(String)
  if (typeof v === 'string') return v.split('\n').filter(Boolean)
  return [String(v)]
}

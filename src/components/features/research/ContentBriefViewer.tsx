'use client'

import { useState } from 'react'

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

export function ContentBriefViewer({ notes, onClose }: ContentBriefViewerProps) {
  let brief: ContentBrief
  try {
    brief = JSON.parse(notes)
  } catch {
    brief = { topic: notes }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div
        className="relative mx-4 flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              {brief.topic || 'Content Brief'}
            </h2>
            <button
              onClick={() => {
                const slug = (brief.topic || 'brief').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                const blob = new Blob([JSON.stringify(brief, null, 2)], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `${slug}-brief.json`
                a.click()
                URL.revokeObjectURL(url)
              }}
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
            {brief.angle && <Field title="Angle" value={brief.angle} />}
            {brief.target_audience && <Field title="Target Audience" value={brief.target_audience} />}
            {brief.channels && brief.channels.length > 0 && <ChannelsList channels={brief.channels} />}
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
  const name = channel.channel || `Channel`
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

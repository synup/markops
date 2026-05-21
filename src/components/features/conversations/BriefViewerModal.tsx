'use client'

import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'

const ASSET_TYPE_LABEL: Record<string, string> = {
  blog_post: 'Blog post',
  deep_article: 'Deep article',
  use_case: 'Use case',
  collateral: 'Collateral',
  tool: 'Tool',
}

type BriefWithContent = {
  asset_type: string
  status: string
  brief_content: string | null
}

type Props = {
  isOpen: boolean
  onClose: () => void
  callInsightId: string
}

export function BriefViewerModal({ isOpen, onClose, callInsightId }: Props) {
  const [brief, setBrief] = useState<BriefWithContent | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch when opened; clear state when closed.
  useEffect(() => {
    if (!isOpen) {
      setBrief(null)
      setError(null)
      setIsLoading(false)
      return
    }
    let cancelled = false
    const ctrl = new AbortController()
    setIsLoading(true)
    setError(null)
    fetch(
      `/api/conversations/${encodeURIComponent(callInsightId)}/brief?content=true`,
      { signal: ctrl.signal, cache: 'no-store' },
    )
      .then(async resp => {
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
        return (await resp.json()) as { brief: BriefWithContent | null }
      })
      .then(data => {
        if (cancelled) return
        setBrief(data.brief)
        setIsLoading(false)
      })
      .catch(e => {
        if (cancelled) return
        if (e instanceof DOMException && e.name === 'AbortError') return
        setError(e instanceof Error ? e.message : String(e))
        setIsLoading(false)
      })
    return () => { cancelled = true; ctrl.abort() }
  }, [isOpen, callInsightId])

  // Escape closes.
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const label = brief?.asset_type
    ? ASSET_TYPE_LABEL[brief.asset_type] ?? brief.asset_type
    : 'Brief'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Brief viewer"
    >
      <div
        className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-lg bg-white shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-8 py-5">
          <h2 className="text-[18px] font-medium text-slate-900">{label} brief</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close brief viewer"
            className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          {isLoading && <div className="text-[14px] text-slate-500">Loading brief…</div>}
          {error && (
            <div className="rounded-md border-[0.5px] border-red-200 bg-red-50 p-4 text-[14px] text-red-700">
              Failed to load brief: {error}
            </div>
          )}
          {!isLoading && !error && brief?.brief_content && (
            <article>
              <ReactMarkdown components={MD_COMPONENTS}>{brief.brief_content}</ReactMarkdown>
            </article>
          )}
          {!isLoading && !error && brief && !brief.brief_content && (
            <div className="text-[14px] text-slate-500">No brief content available yet.</div>
          )}
          {!isLoading && !error && !brief && (
            <div className="text-[14px] text-slate-500">Brief not found.</div>
          )}
        </div>
      </div>
    </div>
  )
}

const MD_COMPONENTS: Components = {
  h1: ({ children }) => <h1 className="mb-3 mt-6 text-2xl font-bold text-slate-900 first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-2 mt-5 text-xl font-semibold text-slate-900">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-2 mt-4 text-lg font-semibold text-slate-900">{children}</h3>,
  p:  ({ children }) => <p className="mb-4 text-base leading-relaxed text-slate-700">{children}</p>,
  ul: ({ children }) => <ul className="mb-4 list-disc space-y-1 pl-6 text-slate-700">{children}</ul>,
  ol: ({ children }) => <ol className="mb-4 list-decimal space-y-1 pl-6 text-slate-700">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  code: ({ children }) => <code className="rounded bg-slate-100 px-1 font-mono text-sm text-slate-800">{children}</code>,
  strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ children, href }) => <a href={href} target="_blank" rel="noreferrer" className="text-cyan-700 underline hover:text-cyan-800">{children}</a>,
  hr: () => <hr className="my-6 border-slate-200" />,
}

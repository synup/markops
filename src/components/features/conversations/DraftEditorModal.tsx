'use client'

import { useEffect, useMemo, useState } from 'react'
import { useDraftEditor } from '@/hooks/useDraftEditor'
import { DraftEditorFooter } from './DraftEditorFooter'

const VOICE_LABEL: Record<string, string> = {
  sudy: 'Sudy', roshan: 'Roshan', niladri: 'Niladri',
}

type Props = {
  isOpen: boolean
  onClose: () => void
  callInsightId: string
}

export function DraftEditorModal({ isOpen, onClose, callInsightId }: Props) {
  const ed = useDraftEditor(callInsightId, isOpen)
  const [showSaved, setShowSaved] = useState(false)

  useEffect(() => {
    if (!ed.savedAt) return
    setShowSaved(true)
    const t = setTimeout(() => setShowSaved(false), 3000)
    return () => clearTimeout(t)
  }, [ed.savedAt])

  const closeWithConfirm = () => {
    if (ed.hasChanges && !confirm('You have unsaved changes. Discard and close?')) return
    onClose()
  }

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeWithConfirm() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, ed.hasChanges, onClose])

  const stats = useMemo(() => {
    const chars = ed.pending.length
    const words = ed.pending.trim().length === 0 ? 0 : ed.pending.trim().split(/\s+/).length
    return `${words} words / ${chars} chars`
  }, [ed.pending])

  if (!isOpen) return null

  const voiceLabel = ed.draft?.author_voice ? VOICE_LABEL[ed.draft.author_voice] ?? ed.draft.author_voice : ''

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={closeWithConfirm}
      role="dialog"
      aria-modal="true"
      aria-label="Draft editor"
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-[16px] font-medium text-slate-900">
              Draft{voiceLabel ? ` (${voiceLabel})` : ''}
            </h2>
            <div className="mt-0.5 flex items-center gap-3 text-[12px] text-slate-500">
              <span>{stats}</span>
              {showSaved && ed.savedAt && (
                <span className="inline-flex items-center gap-1.5 text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                  Saved {new Date(ed.savedAt).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={closeWithConfirm}
            aria-label="Close draft editor"
            className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {ed.isLoading && <div className="text-[14px] text-slate-500">Loading draft…</div>}
          {ed.error && (
            <div className="mb-3 rounded-md border-[0.5px] border-red-200 bg-red-50 p-3 text-[13px] text-red-700">
              {ed.error}
            </div>
          )}
          {!ed.isLoading && ed.draft && (
            <textarea
              value={ed.pending}
              onChange={e => ed.setPending(e.target.value)}
              spellCheck
              className="min-h-[400px] w-full resize-y rounded-md border border-slate-200 bg-white p-4 font-mono text-sm leading-relaxed text-slate-900 focus:border-slate-400 focus:outline-none"
              aria-label="Draft content"
            />
          )}
          {!ed.isLoading && !ed.draft && !ed.error && (
            <div className="text-[14px] text-slate-500">No draft available.</div>
          )}
        </div>

        <DraftEditorFooter
          pending={ed.pending}
          hasChanges={ed.hasChanges}
          canSave={ed.hasChanges && !!ed.draft}
          isSaving={ed.isSaving}
          onCopy={() => navigator.clipboard?.writeText(ed.pending)}
          onDiscard={ed.discard}
          onSave={ed.save}
        />
      </div>
    </div>
  )
}

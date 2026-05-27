'use client'

import { useEffect, useState } from 'react'
import { type ConversationRow } from '@/types/conversation'
import { type AssetType, type AuthorVoice } from './ApprovalPicker'
import { Chip } from '@/components/ui/Chip'
import { DrawerHeader } from './DrawerHeader'
import { DrawerVerbatim } from './DrawerVerbatim'
import { DrawerScores } from './DrawerScores'
import { DrawerMetadata } from './DrawerMetadata'
import { DrawerActions } from './DrawerActions'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-[14px] font-medium text-slate-700">{title}</h3>
      {children}
    </section>
  )
}

type Props = {
  row: ConversationRow | null
  onClose: () => void
  onApprove: (assetType: AssetType, authorVoice?: AuthorVoice) => void
  onReject: (reason: string | null) => void
  onRevoke: () => void
}

export function DetailDrawer({ row, onClose, onApprove, onReject, onRevoke }: Props) {
  // Keep last-rendered row alive during exit so the panel doesn't go blank while sliding out.
  const [rendered, setRendered] = useState<ConversationRow | null>(row)

  useEffect(() => {
    if (row) {
      setRendered(row)
      return
    }
    const t = setTimeout(() => setRendered(null), 300)
    return () => clearTimeout(t)
  }, [row])

  useEffect(() => {
    if (!row) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [row, onClose])

  const open = row != null

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-900/40 transition-opacity duration-200 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-screen w-[480px] max-w-[90vw] flex-col bg-white shadow-xl transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Conversation detail"
      >
        {rendered && (
          <>
            <DrawerHeader row={rendered} onClose={onClose} />
            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
              <Section title="Summary">
                <p className="whitespace-pre-line text-[14px] leading-[1.65] text-slate-700">
                  {rendered.marketing_summary || '(no summary generated)'}
                </p>
              </Section>
              <Section title="Customer quotes">
                <DrawerVerbatim quotes={rendered.customer_verbatim} />
              </Section>
              <DrawerScores row={rendered} />
              <Section title="Attribution">
                <div className="space-y-1 text-[13px] text-slate-600">
                  <div>
                    Category:{' '}
                    <span className="text-slate-900">{rendered.attribution_category || '—'}</span>
                    {rendered.attribution_detail && (
                      <span className="text-slate-500"> ({rendered.attribution_detail})</span>
                    )}
                  </div>
                  <div>
                    Asked by rep:{' '}
                    <span className={rendered.attribution_asked ? 'text-emerald-700' : 'text-amber-700'}>
                      {rendered.attribution_asked == null ? '—' : rendered.attribution_asked ? 'yes' : 'no'}
                    </span>
                  </div>
                  {rendered.attribution_confidence != null && (
                    <div>
                      Confidence:{' '}
                      <span className="text-slate-900">{rendered.attribution_confidence.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </Section>
              <Section title="Conversation type">
                <div className="flex flex-wrap items-center gap-2">
                  <Chip label={`current: ${rendered.sales_calls.conversation_type}`} />
                  {rendered.suggested_conversation_type && (
                    <Chip
                      label={`suggested: ${rendered.suggested_conversation_type}${
                        rendered.conversation_type_confidence != null
                          ? ` (${rendered.conversation_type_confidence.toFixed(2)})`
                          : ''
                      }`}
                    />
                  )}
                </div>
              </Section>
              <DrawerMetadata sc={rendered.sales_calls} />
              {rendered.review_status === 'rejected' && rendered.rejection_reason && (
                <Section title="Rejection reason">
                  <p className="rounded-md bg-slate-50 px-3 py-2 text-[13px] text-slate-600">
                    {rendered.rejection_reason}
                  </p>
                </Section>
              )}
            </div>
            <div className="border-t border-slate-200 px-6 py-4">
              <DrawerActions
                row={rendered}
                onApprove={onApprove}
                onReject={onReject}
                onRevoke={onRevoke}
              />
            </div>
          </>
        )}
      </aside>
    </>
  )
}

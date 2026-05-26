'use client'

import { useEffect, useState } from 'react'
import type { DrawerTarget } from '@/hooks/useResearchDrawer'
import type { ToolApprovalDetails } from '@/hooks/useResearchToolActions'
import type { ContentApprovalDetails } from '@/hooks/useResearchContentActions'
import { DrawerResearchHeader } from './DrawerResearchHeader'
import { DrawerPostBody } from './DrawerPostBody'
import { DrawerScoreBreakdown } from './DrawerScoreBreakdown'
import { DrawerRedditMeta } from './DrawerRedditMeta'
import { DrawerResearchActions } from './DrawerResearchActions'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-[14px] font-medium text-slate-700">{title}</h3>
      {children}
    </section>
  )
}

type Props = {
  target: DrawerTarget | null
  onClose: () => void
  onApprove: (target: DrawerTarget, details: ToolApprovalDetails | ContentApprovalDetails) => void
  onReject: (target: DrawerTarget, reason: string | null) => void
  onRevoke: (target: DrawerTarget) => void
}

export function ResearchDetailDrawer({ target, onClose, onApprove, onReject, onRevoke }: Props) {
  const [rendered, setRendered] = useState<DrawerTarget | null>(target)

  useEffect(() => {
    if (target) {
      setRendered(target)
      return
    }
    const t = setTimeout(() => setRendered(null), 300)
    return () => clearTimeout(t)
  }, [target])

  useEffect(() => {
    if (!target) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [target, onClose])

  const open = target != null

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
        aria-label="Research idea detail"
      >
        {rendered && (
          <>
            <DrawerResearchHeader target={rendered} onClose={onClose} />
            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
              <DrawerPostBody post={rendered.idea.post} />
              <Section title={rendered.kind === 'tool' ? 'Reasoning' : 'Brief'}>
                <p className="whitespace-pre-line text-[14px] leading-[1.65] text-slate-700">
                  {rendered.idea.action_rationale || '(none)'}
                </p>
              </Section>
              <DrawerScoreBreakdown target={rendered} />
              <DrawerRedditMeta post={rendered.idea.post} />
              {rendered.idea.latest_action?.notes && (
                <Section
                  title={rendered.idea.latest_action.action === 'rejected' ? 'Rejection reason' : 'Notes'}
                >
                  <p className="rounded-md bg-slate-50 px-3 py-2 text-[13px] text-slate-600">
                    {rendered.idea.latest_action.notes}
                  </p>
                </Section>
              )}
            </div>
            <div className="border-t border-slate-200 px-6 py-4">
              <DrawerResearchActions
                target={rendered}
                onApprove={d => onApprove(rendered, d)}
                onReject={r => onReject(rendered, r)}
                onRevoke={() => onRevoke(rendered)}
              />
            </div>
          </>
        )}
      </aside>
    </>
  )
}

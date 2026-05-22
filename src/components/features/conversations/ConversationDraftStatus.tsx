'use client'

import { useState } from 'react'
import { useConversationDraft, type DraftStatusResponse } from '@/hooks/useConversationDraft'
import { DraftEditorModal } from './DraftEditorModal'

const VOICE_LABEL: Record<DraftStatusResponse['author_voice'], string> = {
  sudy: 'Sudy',
  roshan: 'Roshan',
  niladri: 'Niladri',
}

const AMBER_PILL =
  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ' +
  'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200'

const CYAN_BUTTON =
  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium ' +
  'bg-cyan-500 text-white hover:bg-cyan-600 transition-colors'

const ROSE_PILL =
  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ' +
  'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200'

type Props = {
  callInsightId: string
  enabled?: boolean
}

export function ConversationDraftStatus({ callInsightId, enabled = true }: Props) {
  const { draft } = useConversationDraft(callInsightId, { enabled })
  const [modalOpen, setModalOpen] = useState(false)

  if (!draft) return null

  if (draft.status === 'pending') {
    return <span className={AMBER_PILL}>Queued for draft</span>
  }
  if (draft.status === 'generating') {
    return (
      <span className={AMBER_PILL}>
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" aria-hidden />
        Generating draft…
      </span>
    )
  }
  if (draft.status === 'failed') {
    return (
      <span className={ROSE_PILL} title={draft.error_message || 'Draft generation failed'}>
        Draft failed
      </span>
    )
  }

  // status === 'ready'
  const label = VOICE_LABEL[draft.author_voice] ?? draft.author_voice
  return (
    <>
      <button
        type="button"
        className={CYAN_BUTTON}
        onClick={() => setModalOpen(true)}
      >
        View draft ({label})
      </button>
      <DraftEditorModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        callInsightId={callInsightId}
      />
    </>
  )
}

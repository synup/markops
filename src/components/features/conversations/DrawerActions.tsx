'use client'

import { useState } from 'react'
import { type ConversationRow } from '@/types/conversation'
import { useConversationBrief } from '@/hooks/useConversationBrief'
import { ApprovalPicker, type AssetType } from './ApprovalPicker'
import { RejectInput } from './RejectInput'
import { ConversationBriefStatus } from './ConversationBriefStatus'
import { BriefViewerModal } from './BriefViewerModal'

type Props = {
  row: ConversationRow
  onApprove: (assetType: AssetType) => void
  onReject: (reason: string | null) => void
  onRevoke: () => void
}

type Mode = 'collapsed' | 'approve' | 'reject'

export function DrawerActions({ row, onApprove, onReject, onRevoke }: Props) {
  const [mode, setMode] = useState<Mode>('collapsed')
  const [viewerOpen, setViewerOpen] = useState(false)
  const isApproved = row.review_status === 'approved'

  // Gate the View brief button on a ready brief existing for this insight.
  // The hook is also active inside <ConversationBriefStatus> below — accepted
  // duplication so each component stays self-contained.
  const { brief } = useConversationBrief(row.id, { enabled: isApproved })
  const isViewable = brief?.status === 'ready' && brief?.has_content === true

  if (mode === 'approve') {
    return (
      <ApprovalPicker
        suggested={row.suggested_asset_type as AssetType | null}
        onConfirm={onApprove}
        onCancel={() => setMode('collapsed')}
      />
    )
  }
  if (mode === 'reject') {
    return (
      <RejectInput
        onConfirm={onReject}
        onCancel={() => setMode('collapsed')}
      />
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {row.review_status === 'pending' && (
        <>
          <button
            type="button"
            onClick={() => setMode('reject')}
            className="flex-1 rounded-md border-[0.5px] border-slate-300 bg-white px-3 py-2 text-[14px] text-slate-700 transition-colors duration-150 hover:bg-slate-100"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => setMode('approve')}
            className="flex-1 rounded-md bg-cyan-500 px-3 py-2 text-[14px] text-white transition-colors duration-150 hover:bg-cyan-600"
          >
            Approve
          </button>
        </>
      )}
      {isApproved && (
        <>
          <button
            type="button"
            disabled={!isViewable}
            onClick={isViewable ? () => setViewerOpen(true) : undefined}
            title={isViewable ? 'View brief content' : 'Brief not ready yet'}
            className={
              isViewable
                ? 'rounded-md border-[0.5px] border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-700 transition-colors duration-150 hover:bg-slate-100'
                : 'rounded-md border-[0.5px] border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-400 cursor-not-allowed'
            }
          >
            View brief
          </button>
          <ConversationBriefStatus callInsightId={row.id} enabled={isApproved} />
          <button
            type="button"
            onClick={onRevoke}
            className="ml-auto rounded-md border-[0.5px] border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-700 transition-colors duration-150 hover:bg-slate-100"
          >
            Revoke
          </button>
          <BriefViewerModal
            isOpen={viewerOpen}
            onClose={() => setViewerOpen(false)}
            callInsightId={row.id}
          />
        </>
      )}
      {row.review_status === 'rejected' && (
        <button
          type="button"
          onClick={onRevoke}
          className="w-full rounded-md border-[0.5px] border-slate-300 bg-white px-3 py-2 text-[14px] text-slate-700 transition-colors duration-150 hover:bg-slate-100"
        >
          Revoke
        </button>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import type { DrawerTarget } from '@/hooks/useResearchDrawer'
import type { ToolApprovalDetails } from '@/hooks/useResearchToolActions'
import type { ContentApprovalDetails } from '@/hooks/useResearchContentActions'
import { ToolApprovalForm } from './ToolApprovalForm'
import { ContentApprovalForm } from './ContentApprovalForm'
import { ResearchRejectForm } from './ResearchRejectForm'

type Props = {
  target: DrawerTarget
  onApprove: (details: ToolApprovalDetails | ContentApprovalDetails) => void
  onReject: (reason: string | null) => void
  onRevoke: () => void
}

type Mode = 'collapsed' | 'approve' | 'reject'

export function DrawerResearchActions({ target, onApprove, onReject, onRevoke }: Props) {
  const [mode, setMode] = useState<Mode>('collapsed')

  if (mode === 'approve') {
    return target.kind === 'tool' ? (
      <ToolApprovalForm
        onConfirm={onApprove as (d: ToolApprovalDetails) => void}
        onCancel={() => setMode('collapsed')}
      />
    ) : (
      <ContentApprovalForm
        onConfirm={onApprove as (d: ContentApprovalDetails) => void}
        onCancel={() => setMode('collapsed')}
      />
    )
  }

  if (mode === 'reject') {
    return (
      <ResearchRejectForm
        onConfirm={onReject}
        onCancel={() => setMode('collapsed')}
      />
    )
  }

  const action = target.idea.latest_action

  if (!action) {
    return (
      <div className="flex flex-wrap gap-2">
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
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onRevoke}
      className="w-full rounded-md border-[0.5px] border-slate-300 bg-white px-3 py-2 text-[14px] text-slate-700 transition-colors duration-150 hover:bg-slate-100"
    >
      Revoke
    </button>
  )
}

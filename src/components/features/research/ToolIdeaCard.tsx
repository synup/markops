'use client'

import type { ToolIdea } from '@/hooks/useRedditResearch'
import type { ToolApprovalDetails } from '@/hooks/useResearchToolActions'
import { ResearchScoreBadge } from './ResearchScoreBadge'
import { ToolApprovalForm } from './ToolApprovalForm'
import { ResearchRejectForm } from './ResearchRejectForm'
import { Chip } from '@/components/ui/Chip'
import { Button } from '@/components/ui/Button'

export type ToolCardMode = 'collapsed' | 'approve' | 'reject'

const formatDate = (iso: string) => {
  try {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      .format(new Date(iso))
  } catch { return iso }
}

const stop = (e: React.MouseEvent) => e.stopPropagation()

type Props = {
  idea: ToolIdea
  focused?: boolean
  exiting?: boolean
  mode?: ToolCardMode
  onModeChange?: (mode: ToolCardMode) => void
  onOpenDrawer: (id: number) => void
  onApprove: (details: ToolApprovalDetails) => void
  onReject: (reason: string | null) => void
  onRevoke: () => void
}

export function ToolIdeaCard({
  idea, focused, exiting, mode = 'collapsed',
  onModeChange, onOpenDrawer, onApprove, onReject, onRevoke,
}: Props) {
  const action = idea.latest_action
  const assignedTo = action?.assigned_to ?? null

  const subtitle = `r/${idea.post.subreddit} · ${idea.post.upvotes} pts · ${idea.post.num_comments} comments · ${formatDate(idea.post.published_at ?? idea.post.collected_at)}`

  return (
    <div
      onClick={() => mode === 'collapsed' && onOpenDrawer(Number(idea.id))}
      className={[
        'group rounded-xl border-[0.5px] border-slate-200 bg-white p-5 transition-[transform,opacity,border-color,box-shadow] duration-[250ms]',
        mode === 'collapsed' ? 'cursor-pointer hover:border-slate-300 hover:shadow-sm' : '',
        focused ? 'ring-2 ring-cyan-500/40' : '',
        exiting ? 'translate-x-8 opacity-0' : '',
      ].filter(Boolean).join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-medium text-slate-900">{idea.post.title}</div>
          <div className="mt-0.5 text-[13px] text-slate-500">{subtitle}</div>
        </div>
        <ResearchScoreBadge score={idea.composite_score} max={30} />
      </div>

      {idea.action_rationale && (
        <p className="mt-3 text-[15px] leading-[1.65] text-slate-900">{idea.action_rationale}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {idea.post.category && <Chip label={idea.post.category} />}
          {action?.action === 'approved' && assignedTo && (
            <Chip label={`assigned to ${assignedTo}`} />
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-wrap gap-2" onClick={stop}>
            {!action && (
              <>
                <Button variant="secondary" onClick={() => onModeChange?.('reject')}>Reject</Button>
                <Button variant="primary" onClick={() => onModeChange?.('approve')}>Approve</Button>
              </>
            )}
            {action && (
              <Button variant="secondary" onClick={onRevoke}>Revoke</Button>
            )}
          </div>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="shrink-0 text-slate-400 group-hover:text-slate-600 transition-colors">
            <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {action?.notes && (
        <div className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-[13px] text-slate-600">
          <span className="font-medium text-slate-700">
            {action.action === 'rejected' ? 'Reason:' : 'Notes:'}
          </span>{' '}
          {action.notes}
        </div>
      )}

      {mode === 'approve' && (
        <div onClick={stop}>
          <ToolApprovalForm onConfirm={onApprove} onCancel={() => onModeChange?.('collapsed')} />
        </div>
      )}
      {mode === 'reject' && (
        <div onClick={stop}>
          <ResearchRejectForm onConfirm={onReject} onCancel={() => onModeChange?.('collapsed')} />
        </div>
      )}
    </div>
  )
}

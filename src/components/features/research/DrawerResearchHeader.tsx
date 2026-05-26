import type { DrawerTarget } from '@/hooks/useResearchDrawer'
import { ResearchScoreBadge } from './ResearchScoreBadge'

type Props = {
  target: DrawerTarget
  onClose: () => void
}

export function DrawerResearchHeader({ target, onClose }: Props) {
  const { idea } = target

  return (
    <div className="border-b border-slate-200 px-6 py-4">
      <div className="mb-2 flex items-start justify-between gap-3">
        <h2 className="text-[18px] font-medium text-slate-900">{idea.post.title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-slate-400 transition-colors duration-150 hover:text-slate-600"
          aria-label="Close drawer"
        >
          <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
              d="M3 3L11 11M11 3L3 11"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
      <div className="flex items-center gap-3">
        <ResearchScoreBadge
          score={idea.composite_score}
          max={target.kind === 'tool' ? 30 : 20}
        />
        <span className="text-[13px] text-slate-500">r/{idea.post.subreddit}</span>
      </div>
    </div>
  )
}

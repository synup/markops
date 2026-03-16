'use client'

import type { ToolIdea } from '@/hooks/useRedditResearch'
import { ScoreBar } from './ScoreBar'

interface ToolIdeaRowProps {
  idea: ToolIdea
  onApprove: (id: number) => void
  onReject: (id: number) => void
}

export function ToolIdeaRow({ idea, onApprove, onReject }: ToolIdeaRowProps) {
  const status = idea.latest_action?.action
  const isActed = !!status

  return (
    <div
      className="rounded-lg p-4"
      style={{
        background: 'var(--surface)',
        border: `1px solid ${isActed ? (status === 'approved' ? 'var(--green)' : 'var(--red)') : 'var(--border)'}`,
        opacity: isActed ? 0.7 : 1,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <a
            href={`https://reddit.com${idea.post.permalink}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium hover:underline"
            style={{ color: 'var(--text)' }}
          >
            {idea.post.title}
          </a>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>r/{idea.post.subreddit}</span>
            <span style={{ color: 'var(--text-dim)' }}>·</span>
            <span>{idea.post.score} pts</span>
            <span style={{ color: 'var(--text-dim)' }}>·</span>
            <span>{idea.post.num_comments} comments</span>
            <span
              className="rounded px-1.5 py-0.5 text-[10px] font-medium"
              style={{ background: 'var(--brand-muted)', color: 'var(--brand)' }}
            >
              {idea.category}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {isActed ? (
            <span
              className="rounded px-2 py-1 text-xs font-medium"
              style={{
                background: status === 'approved' ? 'var(--green-muted)' : 'var(--red-muted)',
                color: status === 'approved' ? 'var(--green)' : 'var(--red)',
              }}
            >
              {status}
            </span>
          ) : (
            <>
              <button
                onClick={() => onApprove(idea.id)}
                className="rounded px-2.5 py-1 text-xs font-medium transition-colors"
                style={{ background: 'var(--green-muted)', color: 'var(--green)' }}
              >
                Approve
              </button>
              <button
                onClick={() => onReject(idea.id)}
                className="rounded px-2.5 py-1 text-xs font-medium transition-colors"
                style={{ background: 'var(--red-muted)', color: 'var(--red)' }}
              >
                Reject
              </button>
            </>
          )}
        </div>
      </div>

      {/* Score breakdown */}
      <div className="mt-3 grid grid-cols-4 gap-3">
        <ScoreBar label="Relevance" value={idea.relevance_score} max={10} />
        <ScoreBar label="Pain Level" value={idea.pain_level} max={10} />
        <ScoreBar label="Tool Fit" value={idea.tool_fit} max={10} />
        <ScoreBar label="Total" value={idea.total_score} max={30} color="var(--brand)" />
      </div>

      {idea.reasoning && (
        <p className="mt-2 text-xs" style={{ color: 'var(--text-dim)' }}>
          {idea.reasoning}
        </p>
      )}
    </div>
  )
}

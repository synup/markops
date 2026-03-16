'use client'

import type { ContentIdea } from '@/hooks/useRedditResearch'
import { ScoreBar } from './ScoreBar'

interface ContentIdeaRowProps {
  idea: ContentIdea
  onApprove: (postId: string) => void
  onReject: (postId: string) => void
}

export function ContentIdeaRow({ idea, onApprove, onReject }: ContentIdeaRowProps) {
  const status = idea.latest_action?.action
  const isActed = status === 'approved' || status === 'rejected'

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
            href={idea.post.url}
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
            <span>{idea.post.upvotes} pts</span>
            {idea.icp_match && (
              <>
                <span style={{ color: 'var(--text-dim)' }}>·</span>
                <span
                  className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                  style={{ background: 'var(--green-muted)', color: 'var(--green)' }}
                >
                  ICP Match
                </span>
              </>
            )}
            {idea.content_cluster && (
              <>
                <span style={{ color: 'var(--text-dim)' }}>·</span>
                <span
                  className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                  style={{ background: 'var(--brand-muted)', color: 'var(--brand)' }}
                >
                  {idea.content_cluster.replace(/_/g, ' ')}
                </span>
              </>
            )}
            {idea.content_type && (
              <>
                <span style={{ color: 'var(--text-dim)' }}>·</span>
                <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>
                  {idea.content_type.replace(/_/g, ' ')}
                </span>
              </>
            )}
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
                onClick={() => onApprove(idea.post_id)}
                className="rounded px-2.5 py-1 text-xs font-medium transition-colors"
                style={{ background: 'var(--green-muted)', color: 'var(--green)' }}
              >
                Approve
              </button>
              <button
                onClick={() => onReject(idea.post_id)}
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
      <div className="mt-3 grid grid-cols-3 gap-3 md:grid-cols-6">
        <ScoreBar label="Relevance" value={idea.relevance_score} max={10} />
        <ScoreBar label="Search Demand" value={idea.search_demand_score} max={10} />
        <ScoreBar label="Engagement" value={idea.engagement_score} max={10} />
        <ScoreBar label="Recency" value={idea.recency_score} max={10} />
        <ScoreBar label="Comp. Gap" value={idea.competitive_gap_score} max={10} />
        <ScoreBar label="Composite" value={idea.composite_score} max={100} color="var(--blue)" />
      </div>

      {idea.action_rationale && (
        <p className="mt-2 text-xs" style={{ color: 'var(--text-dim)' }}>
          {idea.action_rationale}
        </p>
      )}
    </div>
  )
}

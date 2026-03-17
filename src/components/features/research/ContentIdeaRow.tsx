'use client'

import { useState } from 'react'
import type { ContentIdea } from '@/hooks/useRedditResearch'
import { ScoreBar } from './ScoreBar'
import { PostPreview } from './PostPreview'
import { ReclassifyButton } from './ReclassifyButton'
import { ContentBriefViewer } from './ContentBriefViewer'

interface ContentIdeaRowProps {
  idea: ContentIdea
  onApprove: (postId: string) => void
  onReject: (postId: string) => void
  onReclassify: (postId: string, scoreId: string) => void
}

export function ContentIdeaRow({ idea, onApprove, onReject, onReclassify }: ContentIdeaRowProps) {
  const [showBrief, setShowBrief] = useState(false)
  const status = idea.latest_action?.action
  const isActed = !!status
  const hasBrief = status === 'brief_complete' && idea.latest_action?.notes

  return (
    <div
      className="rounded-lg p-4"
      style={{
        background: 'var(--surface)',
        border: `1px solid ${status === 'approved' ? 'var(--green)' : status === 'rejected' ? 'var(--red)' : status === 'brief_complete' ? 'var(--blue)' : 'var(--border)'}`,
        opacity: isActed ? 0.7 : 1,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <a
            href={idea.post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-base font-semibold hover:underline"
            style={{ color: '#E5E7EB' }}
          >
            {idea.post.title}
          </a>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span className="rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ background: 'var(--surface-3)' }}>
              r/{idea.post.subreddit}
            </span>
            <span>{idea.post.upvotes} pts</span>
            <span style={{ color: 'var(--text-dim)' }}>·</span>
            <span>{idea.post.num_comments} comments</span>
            {idea.icp_match && (
              <span className="rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ background: 'var(--green-muted)', color: 'var(--green)' }}>ICP Match</span>
            )}
            {idea.content_cluster && (
              <span className="rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ background: 'var(--brand-muted)', color: 'var(--brand)' }}>
                {idea.content_cluster.replace(/_/g, ' ')}
              </span>
            )}
            {idea.content_type && (
              <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>{idea.content_type.replace(/_/g, ' ')}</span>
            )}
          </div>
          <PostPreview post={idea.post} />
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {isActed ? (
            <div className="flex flex-col items-end gap-1.5">
              {hasBrief ? (
                <>
                  <span className="rounded px-2 py-1 text-xs font-medium" style={{ background: 'var(--brand-muted)', color: 'var(--brand)' }}>Brief Ready</span>
                  <button onClick={() => setShowBrief(true)} className="btn-research rounded px-2.5 py-1.5 text-xs font-semibold" style={{ background: 'var(--brand)', color: '#fff' }}>View Brief</button>
                  <button
                    onClick={() => {
                      const brief = (() => { try { return JSON.parse(idea.latest_action!.notes!) } catch { return { notes: idea.latest_action!.notes } } })()
                      const slug = (brief.topic || 'brief').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                      const blob = new Blob([JSON.stringify(brief, null, 2)], { type: 'application/json' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a'); a.href = url; a.download = `${slug}-brief.json`; a.click()
                      URL.revokeObjectURL(url)
                    }}
                    className="btn-research rounded px-2 py-1 text-[10px] font-medium"
                    style={{ background: 'var(--surface-2)', color: 'var(--brand)', border: '1px solid var(--brand-border)' }}
                  >Download Brief</button>
                </>
              ) : status === 'approved' ? (
                <span className="rounded px-2 py-1 text-xs font-medium" style={{ background: 'var(--green-muted)', color: 'var(--green)' }}>Awaiting Brief</span>
              ) : status === 'rejected' ? (
                <span className="rounded px-2 py-1 text-xs font-medium" style={{ background: 'var(--red-muted)', color: 'var(--red)' }}>Rejected</span>
              ) : status === 'published' ? (
                <span className="rounded px-2 py-1 text-xs font-medium" style={{ background: 'var(--green-muted)', color: 'var(--green)' }}>Published</span>
              ) : (
                <span className="rounded px-2 py-1 text-xs font-medium" style={{ background: 'var(--brand-muted)', color: 'var(--brand)' }}>{status}</span>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <button onClick={() => onApprove(idea.post_id)} className="btn-research rounded px-2.5 py-1 text-xs font-medium" style={{ background: 'var(--green-muted)', color: 'var(--green)' }}>Approve</button>
                <button onClick={() => onReject(idea.post_id)} className="btn-research rounded px-2.5 py-1 text-xs font-medium" style={{ background: 'var(--red-muted)', color: 'var(--red)' }}>Reject</button>
              </div>
              <ReclassifyButton targetTrack="Tools" onConfirm={() => onReclassify(idea.post_id, idea.id)} />
            </>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3 md:grid-cols-6">
        <ScoreBar label="Relevance" value={idea.relevance_score} max={10} />
        <ScoreBar label="Search Demand" value={idea.search_demand_score} max={10} />
        <ScoreBar label="Engagement" value={idea.engagement_score} max={10} />
        <ScoreBar label="Recency" value={idea.recency_score} max={10} />
        <ScoreBar label="Comp. Gap" value={idea.competitive_gap_score} max={10} />
        <ScoreBar label="Composite" value={idea.composite_score} max={100} color="var(--blue)" />
      </div>

      {idea.action_rationale && (
        <p className="mt-2 text-[13px] italic" style={{ color: '#C4B5FD' }}>{idea.action_rationale}</p>
      )}
      {showBrief && hasBrief && (
        <ContentBriefViewer notes={idea.latest_action!.notes!} onClose={() => setShowBrief(false)} />
      )}
    </div>
  )
}

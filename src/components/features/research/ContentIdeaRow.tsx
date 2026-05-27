'use client'

import { useState } from 'react'
import type { ContentIdea } from '@/hooks/useRedditResearch'
import { ResearchScoreBar } from './ResearchScoreBar'
import { PostPreview } from './PostPreview'
import { ReclassifyButton } from './ReclassifyButton'
import { ContentBriefViewer, downloadBriefMarkdown } from './ContentBriefViewer'

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

  const borderClass = status === 'approved'
    ? 'border-emerald-300'
    : status === 'rejected'
      ? 'border-rose-300'
      : status === 'brief_complete'
        ? 'border-blue-300'
        : 'border-slate-200'

  return (
    <div className={`rounded-lg border-[0.5px] bg-white p-4 transition-colors duration-200 ${borderClass} ${isActed ? 'opacity-75' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <a
            href={idea.post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-[15px] font-medium text-slate-900 transition-colors duration-150 hover:text-cyan-700"
          >
            {idea.post.title}
          </a>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-slate-500">
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-700">
              r/{idea.post.subreddit}
            </span>
            <span>{idea.post.upvotes} pts</span>
            <span className="text-slate-400">·</span>
            <span>{idea.post.num_comments} comments</span>
            {idea.icp_match && (
              <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">ICP Match</span>
            )}
            {idea.content_cluster && (
              <span className="rounded bg-cyan-50 px-1.5 py-0.5 text-[11px] font-medium text-cyan-700">
                {idea.content_cluster.replace(/_/g, ' ')}
              </span>
            )}
            {idea.content_type && (
              <span className="text-[11px] text-slate-500">{idea.content_type.replace(/_/g, ' ')}</span>
            )}
          </div>
          <PostPreview post={idea.post} />
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {isActed ? (
            <div className="flex flex-col items-end gap-1.5">
              {hasBrief ? (
                <>
                  <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[11px] font-medium text-cyan-700">Brief Ready</span>
                  <button onClick={() => setShowBrief(true)} className="rounded-md bg-cyan-500 px-3 py-1.5 text-[12px] font-medium text-white transition-colors duration-150 hover:bg-cyan-600">View Brief</button>
                  <button
                    onClick={() => downloadBriefMarkdown(idea.latest_action!.notes!)}
                    className="rounded-md border-[0.5px] border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-50"
                  >Download Brief</button>
                </>
              ) : status === 'approved' ? (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">Awaiting Brief</span>
              ) : status === 'rejected' ? (
                <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700">Rejected</span>
              ) : status === 'published' ? (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">Published</span>
              ) : (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">{status}</span>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <button onClick={() => onApprove(idea.post_id)} className="rounded-md bg-emerald-50 px-2.5 py-1 text-[12px] font-medium text-emerald-700 transition-colors duration-150 hover:bg-emerald-100">Approve</button>
                <button onClick={() => onReject(idea.post_id)} className="rounded-md bg-rose-50 px-2.5 py-1 text-[12px] font-medium text-rose-700 transition-colors duration-150 hover:bg-rose-100">Reject</button>
              </div>
              <ReclassifyButton targetTrack="Tools" onConfirm={() => onReclassify(idea.post_id, idea.id)} />
            </>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3 md:grid-cols-6">
        <ResearchScoreBar label="Relevance" value={idea.relevance_score} max={10} />
        <ResearchScoreBar label="Search Demand" value={idea.search_demand_score} max={10} />
        <ResearchScoreBar label="Engagement" value={idea.engagement_score} max={10} />
        <ResearchScoreBar label="Recency" value={idea.recency_score} max={10} />
        <ResearchScoreBar label="Comp. Gap" value={idea.competitive_gap_score} max={10} />
        <ResearchScoreBar label="Composite" value={idea.composite_score} max={100} color="blue" />
      </div>

      {idea.action_rationale && (
        <p className="mt-2 text-[13px] italic text-slate-600">{idea.action_rationale}</p>
      )}
      {showBrief && hasBrief && (
        <ContentBriefViewer notes={idea.latest_action!.notes!} onClose={() => setShowBrief(false)} />
      )}
    </div>
  )
}

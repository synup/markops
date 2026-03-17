'use client'

import { useFeedbackSummary } from '@/hooks/useRedditResearch'

interface FeedbackSummaryProps {
  agentName: string
}

export function FeedbackSummary({ agentName }: FeedbackSummaryProps) {
  const { data, loading } = useFeedbackSummary(agentName)

  if (loading) {
    return <div className="mt-2 h-16 animate-pulse rounded" style={{ background: 'var(--surface-2)' }} />
  }

  if (!data || (data.approvals === 0 && data.rejections === 0)) {
    return (
      <div className="mt-2 rounded px-3 py-2 text-[10px]" style={{ background: 'var(--surface-2)', color: 'var(--text-dim)' }}>
        No feedback yet
      </div>
    )
  }

  const total = data.approvals + data.rejections

  return (
    <div className="mt-2 rounded-lg px-3 py-2" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-dim)' }}>
          Feedback
        </span>
        <span className="text-[10px] font-medium" style={{ color: rateColor(data.approvalRate) }}>
          {data.approvalRate}% approval
        </span>
      </div>

      <div className="mt-1.5 flex items-center gap-2">
        <div className="flex-1">
          <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--surface-3)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${data.approvalRate}%`, background: rateColor(data.approvalRate) }}
            />
          </div>
        </div>
        <div className="flex gap-2 text-[10px]">
          <span style={{ color: 'var(--green)' }}>{data.approvals} ✓</span>
          <span style={{ color: 'var(--red)' }}>{data.rejections} ✗</span>
          <span style={{ color: 'var(--text-dim)' }}>{total} total</span>
        </div>
      </div>

      {data.recent.length > 0 && (
        <div className="mt-2 flex flex-col gap-0.5">
          {data.recent.map(entry => (
            <div key={entry.id} className="flex items-center justify-between text-[10px]">
              <span
                className="rounded px-1 py-0.5 font-medium"
                style={{
                  background: entry.feedback_type === 'approved' ? 'var(--green-muted)' : entry.feedback_type === 'rejected' ? 'var(--red-muted)' : 'var(--surface-3)',
                  color: entry.feedback_type === 'approved' ? 'var(--green)' : entry.feedback_type === 'rejected' ? 'var(--red)' : 'var(--text-muted)',
                }}
              >
                {entry.feedback_type}
              </span>
              <span style={{ color: 'var(--text-dim)' }}>
                {timeAgo(new Date(entry.created_at))}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function rateColor(rate: number): string {
  if (rate >= 70) return 'var(--green)'
  if (rate >= 40) return 'var(--yellow)'
  return 'var(--red)'
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

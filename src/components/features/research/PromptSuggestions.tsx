'use client'

import { usePromptSuggestions, type FeedbackRow } from '@/hooks/useRedditResearch'

interface PromptSuggestionsProps {
  agentName: string
}

export function PromptSuggestions({ agentName }: PromptSuggestionsProps) {
  const { rows, loading, analyze } = usePromptSuggestions(agentName)

  if (!rows.length && !loading) {
    return (
      <button
        onClick={analyze}
        className="btn-research mt-1.5 rounded px-2 py-0.5 text-[10px] font-medium"
        style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
      >
        Suggest Improvements
      </button>
    )
  }

  if (loading) {
    return <div className="mt-1.5 text-[10px]" style={{ color: 'var(--text-dim)' }}>Analyzing feedback...</div>
  }

  const suggestions = buildSuggestions(rows)

  return (
    <div className="mt-2 rounded-lg px-3 py-2" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-dim)' }}>
          Prompt Suggestions
        </span>
        <button
          onClick={analyze}
          className="btn-research text-[10px]"
          style={{ color: 'var(--brand)' }}
        >
          Refresh
        </button>
      </div>
      {suggestions.length === 0 ? (
        <p className="mt-1 text-[10px]" style={{ color: 'var(--text-dim)' }}>
          Not enough feedback data to generate suggestions (need at least 3 entries).
        </p>
      ) : (
        <ul className="mt-1.5 flex flex-col gap-1.5">
          {suggestions.map((s, i) => (
            <li key={i} className="text-[10px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              <span style={{ color: s.severity === 'high' ? 'var(--red)' : 'var(--yellow)' }}>●</span>{' '}
              {s.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

interface Suggestion { text: string; severity: 'high' | 'medium' }

function buildSuggestions(rows: FeedbackRow[]): Suggestion[] {
  if (rows.length < 3) return []

  const suggestions: Suggestion[] = []
  const approved = rows.filter(r => r.feedback_type === 'approved')
  const rejected = rows.filter(r => r.feedback_type === 'rejected')
  const total = approved.length + rejected.length
  if (total === 0) return []

  const rejectionRate = Math.round((rejected.length / total) * 100)

  // Overall rejection rate
  if (rejectionRate > 60) {
    suggestions.push({
      text: `High rejection rate (${rejectionRate}%). Consider tightening relevance criteria or raising score thresholds.`,
      severity: 'high',
    })
  } else if (rejectionRate > 40) {
    suggestions.push({
      text: `Moderate rejection rate (${rejectionRate}%). Review scoring weights — some low-quality ideas may be scoring too high.`,
      severity: 'medium',
    })
  }

  // Subreddit analysis
  const subRejections = new Map<string, { approved: number; rejected: number }>()
  rows.forEach(r => {
    const sub = r.post?.subreddit
    if (!sub) return
    const entry = subRejections.get(sub) ?? { approved: 0, rejected: 0 }
    if (r.feedback_type === 'rejected') entry.rejected++
    else entry.approved++
    subRejections.set(sub, entry)
  })

  for (const [sub, counts] of subRejections) {
    const subTotal = counts.approved + counts.rejected
    if (subTotal >= 2 && counts.rejected / subTotal > 0.7) {
      suggestions.push({
        text: `r/${sub} posts are ${Math.round((counts.rejected / subTotal) * 100)}% rejected (${counts.rejected}/${subTotal}). Consider lowering weight for this subreddit or excluding it.`,
        severity: counts.rejected >= 3 ? 'high' : 'medium',
      })
    }
  }

  // Score threshold analysis
  const approvedScores = approved.filter(r => r.original_score != null).map(r => r.original_score!)
  const rejectedScores = rejected.filter(r => r.original_score != null).map(r => r.original_score!)

  if (approvedScores.length >= 2 && rejectedScores.length >= 2) {
    const avgApproved = Math.round(approvedScores.reduce((a, b) => a + b, 0) / approvedScores.length)
    const avgRejected = Math.round(rejectedScores.reduce((a, b) => a + b, 0) / rejectedScores.length)
    if (avgRejected > avgApproved * 0.7) {
      suggestions.push({
        text: `Rejected ideas average ${avgRejected} score vs ${avgApproved} for approved. Scores don't differentiate well — consider adjusting sub-score weights.`,
        severity: 'medium',
      })
    }
  }

  // Reclassify pattern
  const reclassified = rows.filter(r => r.feedback_type === 'reclassified')
  if (reclassified.length >= 2) {
    suggestions.push({
      text: `${reclassified.length} items were reclassified to another track. Consider adjusting category detection in the prompt.`,
      severity: 'medium',
    })
  }

  return suggestions.slice(0, 4)
}

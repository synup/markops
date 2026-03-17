'use client'

import { useScoreRequest } from '@/hooks/useRedditResearch'

export function ScoreNowButton() {
  const { pending, requestScore } = useScoreRequest()

  return (
    <button
      onClick={requestScore}
      disabled={pending}
      className="rounded-lg px-4 py-2 text-xs font-medium transition-colors"
      style={{
        background: pending ? 'var(--surface-2)' : 'var(--brand)',
        color: pending ? 'var(--text-muted)' : '#fff',
        border: `1px solid ${pending ? 'var(--border)' : 'var(--brand)'}`,
        cursor: pending ? 'not-allowed' : 'pointer',
      }}
    >
      {pending ? 'Scoring...' : 'Score Now'}
    </button>
  )
}

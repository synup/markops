'use client'

import { useScoreRequest } from '@/hooks/useRedditResearch'

export function ScoreNowButton() {
  const { pending, requestScore } = useScoreRequest()

  return (
    <button
      onClick={requestScore}
      disabled={pending}
      className="rounded-md bg-cyan-500 px-4 py-2 text-[13px] font-medium text-white transition-colors duration-150 hover:bg-cyan-600 disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed"
    >
      {pending ? 'Scoring...' : 'Score Now'}
    </button>
  )
}

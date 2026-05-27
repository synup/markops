'use client'

import { useSpecRequest } from '@/hooks/useRedditResearch'

interface GenerateButtonProps {
  type: 'tool_spec' | 'content_brief'
}

export function GenerateButton({ type }: GenerateButtonProps) {
  const { pending, request } = useSpecRequest(type)
  const label = type === 'tool_spec' ? 'Generate Specs Now' : 'Generate Briefs Now'
  const loadingLabel = type === 'tool_spec' ? 'Generating Specs...' : 'Generating Briefs...'

  return (
    <button
      onClick={request}
      disabled={pending}
      className="rounded-md border-[0.5px] border-cyan-200 bg-white px-3 py-1 text-[12px] font-medium text-cyan-700 transition-colors duration-150 hover:bg-cyan-50 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? loadingLabel : label}
    </button>
  )
}

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
      className="btn-research rounded px-3 py-1 text-xs font-medium"
      style={{
        background: pending ? 'var(--surface-2)' : 'var(--surface-2)',
        color: pending ? 'var(--text-dim)' : 'var(--brand)',
        border: `1px solid ${pending ? 'var(--border)' : 'var(--brand-border)'}`,
        cursor: pending ? 'not-allowed' : 'pointer',
      }}
    >
      {pending ? loadingLabel : label}
    </button>
  )
}

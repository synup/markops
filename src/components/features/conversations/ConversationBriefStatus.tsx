'use client'

import { useConversationBrief, type BriefStatusResponse } from '@/hooks/useConversationBrief'

const ASSET_TYPE_LABEL: Record<BriefStatusResponse['asset_type'], string> = {
  blog_post: 'Blog post',
  deep_article: 'Deep article',
  use_case: 'Use case',
  collateral: 'Collateral',
  tool: 'Tool',
}

const AMBER_PILL =
  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ' +
  'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200'

const CYAN_BUTTON =
  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium ' +
  'bg-cyan-500 text-white hover:bg-cyan-600 transition-colors'

const ROSE_PILL =
  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ' +
  'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200'

type Props = {
  callInsightId: string
  enabled?: boolean
}

export function ConversationBriefStatus({ callInsightId, enabled = true }: Props) {
  const { brief } = useConversationBrief(callInsightId, { enabled })

  if (!brief) return null

  if (brief.status === 'pending') {
    return <span className={AMBER_PILL}>Queued for brief</span>
  }

  if (brief.status === 'generating') {
    return (
      <span className={AMBER_PILL}>
        <span
          className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"
          aria-hidden
        />
        Generating brief…
      </span>
    )
  }

  if (brief.status === 'failed') {
    return (
      <span
        className={ROSE_PILL}
        title={brief.error_message || 'Brief generation failed'}
      >
        Brief failed
      </span>
    )
  }

  // status === 'ready'
  const label = ASSET_TYPE_LABEL[brief.asset_type] ?? brief.asset_type
  const downloadUrl = `/api/conversations/${encodeURIComponent(callInsightId)}/brief/download`
  return (
    <button
      type="button"
      className={CYAN_BUTTON}
      onClick={() => {
        const a = document.createElement('a')
        a.href = downloadUrl
        a.setAttribute('download', '')
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }}
    >
      Download brief ({label})
    </button>
  )
}

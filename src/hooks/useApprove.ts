'use client'

import { useCallback } from 'react'
import { useToast } from './useToast'
import type { SuggestedAssetType } from '@/types/conversation'
import type { AuthorVoice } from '@/components/features/conversations/ApprovalPicker'

export type ApproveResult = {
  id: string
  review_status: 'approved'
  approved_asset_type: SuggestedAssetType
  rejection_reason: null
  reviewed_at: string
}

export function useApprove() {
  const { addToast } = useToast()

  return useCallback(
    async (
      id: string,
      assetType: SuggestedAssetType,
      authorVoice?: AuthorVoice,
    ): Promise<ApproveResult> => {
      const body: { approved_asset_type: SuggestedAssetType; author_voice?: AuthorVoice } = {
        approved_asset_type: assetType,
      }
      if (authorVoice) body.author_voice = authorVoice
      const res = await fetch(`/api/conversations/${id}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const detail = (await res.text().catch(() => '')).slice(0, 200)
        const msg = `Approve failed (${res.status})${detail ? `: ${detail}` : ''}`
        addToast(msg, { variant: 'error' })
        throw new Error(msg)
      }
      const { row } = await res.json()
      return row as ApproveResult
    },
    [addToast],
  )
}

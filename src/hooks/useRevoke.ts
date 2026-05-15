'use client'

import { useCallback } from 'react'
import { useToast } from './useToast'

export type RevokeResult = {
  id: string
  review_status: 'pending'
  approved_asset_type: null
  rejection_reason: null
  reviewed_at: null
}

export function useRevoke() {
  const { addToast } = useToast()

  return useCallback(
    async (id: string): Promise<RevokeResult> => {
      const res = await fetch(`/api/conversations/${id}/revoke`, {
        method: 'PATCH',
      })
      if (!res.ok) {
        const detail = (await res.text().catch(() => '')).slice(0, 200)
        const msg = `Revoke failed (${res.status})${detail ? `: ${detail}` : ''}`
        addToast(msg, { variant: 'error' })
        throw new Error(msg)
      }
      const { row } = await res.json()
      return row as RevokeResult
    },
    [addToast],
  )
}

'use client'

import { useCallback } from 'react'
import { useToast } from './useToast'

export type RejectResult = {
  id: string
  review_status: 'rejected'
  rejection_reason: string | null
  approved_asset_type: null
  reviewed_at: string
}

export function useReject() {
  const { addToast } = useToast()

  return useCallback(
    async (id: string, reason: string | null): Promise<RejectResult> => {
      const res = await fetch(`/api/conversations/${id}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejection_reason: reason }),
      })
      if (!res.ok) {
        const detail = (await res.text().catch(() => '')).slice(0, 200)
        const msg = `Reject failed (${res.status})${detail ? `: ${detail}` : ''}`
        addToast(msg, { variant: 'error' })
        throw new Error(msg)
      }
      const { row } = await res.json()
      return row as RejectResult
    },
    [addToast],
  )
}

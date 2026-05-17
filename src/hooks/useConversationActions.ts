'use client'

import { useCallback, useEffect, useState } from 'react'
import { useApprove } from './useApprove'
import { useReject } from './useReject'
import { useRevoke } from './useRevoke'
import { useToast } from './useToast'
import type { ConversationRow, ReviewStatus, SuggestedAssetType } from '@/types/conversation'

const EXIT_MS = 250
const APPROVED_BANNER_MS = 30000

export type LastApproved = {
  rowSnapshot: ConversationRow
  assetType: SuggestedAssetType
}

type ConvOps = {
  rows: ConversationRow[]
  removeRow: (id: string) => void
  bumpCount: (status: ReviewStatus, delta: number) => void
}

export function useConversationActions(conv: ConvOps) {
  const approve = useApprove()
  const reject = useReject()
  const revoke = useRevoke()
  const { addToast } = useToast()

  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set())
  const [lastApproved, setLastApproved] = useState<LastApproved | null>(null)

  // Auto-expire the JustApprovedBanner after 30s.
  useEffect(() => {
    if (!lastApproved) return
    const t = setTimeout(() => setLastApproved(null), APPROVED_BANNER_MS)
    return () => clearTimeout(t)
  }, [lastApproved])

  const animateExit = useCallback((id: string, after: () => void) => {
    setExitingIds(prev => new Set(prev).add(id))
    setTimeout(() => {
      setExitingIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      after()
    }, EXIT_MS)
  }, [])

  const handleApprove = useCallback(async (id: string, assetType: SuggestedAssetType) => {
    const row = conv.rows.find(r => r.id === id)
    if (!row) return
    try {
      await approve(id, assetType)
      setLastApproved({
        rowSnapshot: { ...row, review_status: 'approved', approved_asset_type: assetType },
        assetType,
      })
      animateExit(id, () => {
        conv.removeRow(id)
        conv.bumpCount(row.review_status, -1)
        conv.bumpCount('approved', 1)
      })
    } catch {
      // mutation hook already fired error toast; nothing optimistic to revert
    }
  }, [approve, animateExit, conv])

  const handleReject = useCallback(async (id: string, reason: string | null) => {
    const row = conv.rows.find(r => r.id === id)
    if (!row) return
    try {
      await reject(id, reason)
      animateExit(id, () => {
        conv.removeRow(id)
        conv.bumpCount(row.review_status, -1)
        conv.bumpCount('rejected', 1)
      })
    } catch {
      // toast already fired
    }
  }, [reject, animateExit, conv])

  const handleRevoke = useCallback(async (id: string) => {
    const row = conv.rows.find(r => r.id === id)
    if (!row) return
    try {
      await revoke(id)
      animateExit(id, () => {
        conv.removeRow(id)
        conv.bumpCount(row.review_status, -1)
        conv.bumpCount('pending', 1)
      })
      addToast('Moved back to pending', { variant: 'success', durationMs: 3000 })
    } catch {
      // toast already fired
    }
  }, [revoke, animateExit, conv, addToast])

  const undoApprove = useCallback(async () => {
    if (!lastApproved) return
    const id = lastApproved.rowSnapshot.id
    setLastApproved(null)
    try {
      await revoke(id)
      conv.bumpCount('approved', -1)
      conv.bumpCount('pending', 1)
      addToast('Approval undone', { variant: 'success', durationMs: 3000 })
    } catch {
      // toast already fired
    }
  }, [lastApproved, revoke, conv, addToast])

  const dismissApproved = useCallback(() => setLastApproved(null), [])

  return {
    exitingIds,
    lastApproved,
    handleApprove,
    handleReject,
    handleRevoke,
    undoApprove,
    dismissApproved,
  }
}

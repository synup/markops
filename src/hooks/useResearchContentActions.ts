'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from './useToast'
import type { ContentIdea } from './useRedditResearch'

const EXIT_MS = 250
const APPROVED_BANNER_MS = 30000

export type ContentApprovalDetails = {
  notes: string | null
}

export type LastApprovedContent = {
  ideaSnapshot: ContentIdea
  details: ContentApprovalDetails
}

type Args = {
  ideas: ContentIdea[]
  refresh: () => Promise<void>
}

export function useResearchContentActions(args: Args) {
  const supabase = createClient()
  const { addToast } = useToast()

  const [exitingIds, setExitingIds] = useState<Set<number>>(new Set())
  const [lastApproved, setLastApproved] = useState<LastApprovedContent | null>(null)

  useEffect(() => {
    if (!lastApproved) return
    const t = setTimeout(() => setLastApproved(null), APPROVED_BANNER_MS)
    return () => clearTimeout(t)
  }, [lastApproved])

  const animateExit = useCallback((id: number, after: () => void) => {
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

  const handleApprove = useCallback(async (contentScoreId: number, details: ContentApprovalDetails) => {
    const idea = args.ideas.find(i => String(i.id) === String(contentScoreId))
    if (!idea) return
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('reddit_content_actions').insert({
      content_score_id: contentScoreId,
      action: 'approved',
      notes: details.notes,
      acted_by: user?.id ?? null,
    })
    if (error) {
      addToast(`Failed to approve: ${error.message}`, { variant: 'error', durationMs: 5000 })
      return
    }
    setLastApproved({ ideaSnapshot: { ...idea }, details })
    animateExit(contentScoreId, () => { args.refresh() })
  }, [args, supabase, addToast, animateExit])

  const handleReject = useCallback(async (contentScoreId: number, reason: string | null) => {
    const idea = args.ideas.find(i => String(i.id) === String(contentScoreId))
    if (!idea) return
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('reddit_content_actions').insert({
      content_score_id: contentScoreId,
      action: 'rejected',
      notes: reason,
      acted_by: user?.id ?? null,
    })
    if (error) {
      addToast(`Failed to reject: ${error.message}`, { variant: 'error', durationMs: 5000 })
      return
    }
    animateExit(contentScoreId, () => { args.refresh() })
  }, [args, supabase, addToast, animateExit])

  const handleRevoke = useCallback(async (contentScoreId: number) => {
    const idea = args.ideas.find(i => String(i.id) === String(contentScoreId))
    if (!idea?.latest_action?.id) return
    const { error } = await supabase
      .from('reddit_content_actions')
      .delete()
      .eq('id', idea.latest_action.id)
    if (error) {
      addToast(`Failed to revoke: ${error.message}`, { variant: 'error', durationMs: 5000 })
      return
    }
    animateExit(contentScoreId, () => { args.refresh() })
    addToast('Moved back to pending', { variant: 'success', durationMs: 3000 })
  }, [args, supabase, addToast, animateExit])

  const undoApprove = useCallback(async () => {
    if (!lastApproved) return
    const idea = args.ideas.find(i => i.id === lastApproved.ideaSnapshot.id)
    const actionId = idea?.latest_action?.id
    if (!actionId) return
    const { error } = await supabase
      .from('reddit_content_actions')
      .delete()
      .eq('id', actionId)
    if (error) {
      addToast(`Failed to undo: ${error.message}`, { variant: 'error', durationMs: 5000 })
      return
    }
    setLastApproved(null)
    await args.refresh()
    addToast('Approval undone', { variant: 'success', durationMs: 3000 })
  }, [lastApproved, args, supabase, addToast])

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

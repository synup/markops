'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from './useToast'
import type { ToolIdea } from './useRedditResearch'

const EXIT_MS = 250
const APPROVED_BANNER_MS = 30000

export type ToolApprovalDetails = {
  assigned_to: string | null
  notes: string | null
}

export type LastApprovedTool = {
  ideaSnapshot: ToolIdea
  details: ToolApprovalDetails
}

type Args = {
  ideas: ToolIdea[]
  refresh: () => Promise<void>
}

export function useResearchToolActions(args: Args) {
  const supabase = createClient()
  const { addToast } = useToast()

  const [exitingIds, setExitingIds] = useState<Set<number>>(new Set())
  const [lastApproved, setLastApproved] = useState<LastApprovedTool | null>(null)

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

  const handleApprove = useCallback(async (toolScoreId: number, details: ToolApprovalDetails) => {
    const idea = args.ideas.find(i => String(i.id) === String(toolScoreId))
    if (!idea) return
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('reddit_tool_actions').insert({
      tool_score_id: toolScoreId,
      action: 'approved',
      assigned_to: details.assigned_to,
      notes: details.notes,
      acted_by: user?.id ?? null,
    })
    if (error) {
      addToast(`Failed to approve: ${error.message}`, { variant: 'error', durationMs: 5000 })
      return
    }
    setLastApproved({ ideaSnapshot: { ...idea }, details })
    animateExit(toolScoreId, () => { args.refresh() })
  }, [args, supabase, addToast, animateExit])

  const handleReject = useCallback(async (toolScoreId: number, reason: string | null) => {
    const idea = args.ideas.find(i => String(i.id) === String(toolScoreId))
    if (!idea) return
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('reddit_tool_actions').insert({
      tool_score_id: toolScoreId,
      action: 'rejected',
      notes: reason,
      acted_by: user?.id ?? null,
    })
    if (error) {
      addToast(`Failed to reject: ${error.message}`, { variant: 'error', durationMs: 5000 })
      return
    }
    animateExit(toolScoreId, () => { args.refresh() })
  }, [args, supabase, addToast, animateExit])

  const handleRevoke = useCallback(async (toolScoreId: number) => {
    const idea = args.ideas.find(i => String(i.id) === String(toolScoreId))
    if (!idea?.latest_action?.id) return
    const { error } = await supabase
      .from('reddit_tool_actions')
      .delete()
      .eq('id', idea.latest_action.id)
    if (error) {
      addToast(`Failed to revoke: ${error.message}`, { variant: 'error', durationMs: 5000 })
      return
    }
    animateExit(toolScoreId, () => { args.refresh() })
    addToast('Moved back to pending', { variant: 'success', durationMs: 3000 })
  }, [args, supabase, addToast, animateExit])

  const undoApprove = useCallback(async () => {
    if (!lastApproved) return
    const idea = args.ideas.find(i => i.id === lastApproved.ideaSnapshot.id)
    const actionId = idea?.latest_action?.id
    if (!actionId) return
    const { error } = await supabase
      .from('reddit_tool_actions')
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

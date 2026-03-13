'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface ActionLogEntry {
  id: number
  action_type: string
  keyword_table: string
  keyword_id: number
  term: string
  campaign: string | null
  previous_status: string | null
  new_status: string | null
  performed_by: string
  performed_at: string
  metadata: Record<string, unknown>
  performer_name?: string
  performer_email?: string
}

export function useKeywordActions() {
  const supabase = createClient()

  const logAction = useCallback(async (params: {
    action_type: string
    keyword_table?: string
    keyword_id: number
    term: string
    campaign?: string
    previous_status?: string
    new_status?: string
    metadata?: Record<string, unknown>
  }) => {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('keyword_action_log').insert({
      action_type: params.action_type,
      keyword_table: params.keyword_table ?? 'negative_keywords',
      keyword_id: params.keyword_id,
      term: params.term,
      campaign: params.campaign ?? null,
      previous_status: params.previous_status ?? null,
      new_status: params.new_status ?? null,
      performed_by: user?.id,
      metadata: params.metadata ?? {},
    })
  }, [])

  const logBulkActions = useCallback(async (entries: {
    action_type: string
    keyword_table?: string
    keyword_id: number
    term: string
    campaign?: string
    previous_status?: string
    new_status?: string
    metadata?: Record<string, unknown>
  }[]) => {
    const { data: { user } } = await supabase.auth.getUser()
    const rows = entries.map(e => ({
      action_type: e.action_type,
      keyword_table: e.keyword_table ?? 'negative_keywords',
      keyword_id: e.keyword_id,
      term: e.term,
      campaign: e.campaign ?? null,
      previous_status: e.previous_status ?? null,
      new_status: e.new_status ?? null,
      performed_by: user?.id,
      metadata: e.metadata ?? {},
    }))
    await supabase.from('keyword_action_log').insert(rows)
  }, [])

  const undoAction = useCallback(async (logEntry: ActionLogEntry) => {
    if (!logEntry.previous_status) return false

    // Restore the keyword to its previous status
    const { error } = await supabase
      .from(logEntry.keyword_table)
      .update({ status: logEntry.previous_status, decided_by: null, decided_at: null })
      .eq('id', logEntry.keyword_id)

    if (error) return false

    // Log the undo
    await logAction({
      action_type: 'undone',
      keyword_table: logEntry.keyword_table,
      keyword_id: logEntry.keyword_id,
      term: logEntry.term,
      campaign: logEntry.campaign ?? undefined,
      previous_status: logEntry.new_status ?? undefined,
      new_status: logEntry.previous_status,
      metadata: { undone_action_id: logEntry.id },
    })

    return true
  }, [logAction])

  return { logAction, logBulkActions, undoAction }
}

export function useActionLog(limit: number = 50) {
  const [entries, setEntries] = useState<ActionLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchLog = useCallback(async () => {
    const { data } = await supabase
      .from('keyword_action_log')
      .select('*, profiles:performed_by(full_name, email)')
      .order('performed_at', { ascending: false })
      .limit(limit)

    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped = data.map((d: any) => ({
        ...d,
        performer_name: d.profiles?.full_name ?? null,
        performer_email: d.profiles?.email ?? null,
      }))
      setEntries(mapped)
    }
    setLoading(false)
  }, [limit])

  useEffect(() => { fetchLog() }, [fetchLog])

  return { entries, loading, refetch: fetchLog }
}

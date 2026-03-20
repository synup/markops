'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ErrorLog, JobHeartbeat } from '@/types'

export function useErrorLogs() {
  const [logs, setLogs] = useState<ErrorLog[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchLogs = useCallback(async () => {
    const { data } = await supabase
      .from('error_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    setLogs(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const toggleResolved = useCallback(async (id: number, resolved: boolean) => {
    await supabase
      .from('error_logs')
      .update({ resolved })
      .eq('id', id)
    setLogs(prev => prev.map(l => l.id === id ? { ...l, resolved } : l))
  }, [])

  return { logs, loading, toggleResolved, refetch: fetchLogs }
}

export function useJobHeartbeats() {
  const [heartbeats, setHeartbeats] = useState<JobHeartbeat[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('job_heartbeats')
        .select('*')
        .order('last_seen_at', { ascending: false })
      setHeartbeats(data ?? [])
      setLoading(false)
    }
    fetch()
  }, [])

  return { heartbeats, loading }
}

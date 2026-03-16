'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ChangeLogEntry } from '@/types'

interface PushSummary {
  id: number
  status: string
  keyword_count: number
  pushed_count: number
  failed_count: number
  error_log: string | null
  created_at: string
  completed_at: string | null
}

export function useChangelog() {
  const [entries, setEntries] = useState<ChangeLogEntry[]>([])
  const [pushHistory, setPushHistory] = useState<PushSummary[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetch() {
      const [changeRes, pushRes] = await Promise.all([
        supabase
          .from('change_log')
          .select('*')
          .order('pushed_at', { ascending: false })
          .limit(50),
        supabase
          .from('push_requests')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20),
      ])
      setEntries(changeRes.data ?? [])
      setPushHistory(pushRes.data ?? [])
      setLoading(false)
    }
    fetch()
  }, [])

  return { entries, pushHistory, loading }
}

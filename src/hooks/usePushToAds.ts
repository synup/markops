'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface PushRequest {
  id: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  keyword_count: number
  pushed_count: number
  failed_count: number
  error_log: string | null
  created_at: string
  completed_at: string | null
}

export function usePushToAds() {
  const [latestPush, setLatestPush] = useState<PushRequest | null>(null)
  const [approvedCount, setApprovedCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)
  const supabase = createClient()

  const fetchStatus = useCallback(async () => {
    // Get latest push request
    const { data: pushData } = await supabase
      .from('push_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    setLatestPush(pushData)

    // Count approved keywords ready to push
    const { count } = await supabase
      .from('negative_keywords')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')
    setApprovedCount(count ?? 0)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  // Poll while a push is pending/processing
  useEffect(() => {
    if (!latestPush || !['pending', 'processing'].includes(latestPush.status)) return
    const interval = setInterval(fetchStatus, 5000)
    return () => clearInterval(interval)
  }, [latestPush, fetchStatus])

  const requestPush = async () => {
    if (approvedCount === 0) return
    setRequesting(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('push_requests')
      .insert({
        requested_by: user?.id,
        keyword_count: approvedCount,
        status: 'pending',
      })
      .select()
      .maybeSingle()

    if (!error && data) {
      setLatestPush(data)
    }
    setRequesting(false)
  }

  return { latestPush, approvedCount, loading, requesting, requestPush, refetch: fetchStatus }
}

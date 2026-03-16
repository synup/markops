'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface AuditRequest {
  id: number
  status: 'pending' | 'running' | 'completed' | 'failed'
  requested_at: string
  completed_at: string | null
  error_message: string | null
}

export function useAuditTrigger() {
  const [currentRequest, setCurrentRequest] = useState<AuditRequest | null>(null)
  const [triggering, setTriggering] = useState(false)
  const supabase = createClient()

  // Poll for active request status
  useEffect(() => {
    if (!currentRequest || currentRequest.status === 'completed' || currentRequest.status === 'failed') return

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('audit_requests')
        .select('*')
        .eq('id', currentRequest.id)
        .single()
      if (data) {
        setCurrentRequest(data)
        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(interval)
        }
      }
    }, 10000) // poll every 10 seconds

    return () => clearInterval(interval)
  }, [currentRequest?.id, currentRequest?.status])

  // Check for any active request on mount
  useEffect(() => {
    async function checkActive() {
      const { data } = await supabase
        .from('audit_requests')
        .select('*')
        .in('status', ['pending', 'running'])
        .order('requested_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (data) setCurrentRequest(data)
    }
    checkActive()
  }, [])

  const triggerAudit = useCallback(async () => {
    setTriggering(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('audit_requests')
      .insert({ requested_by: user?.id, status: 'pending' })
      .select()
      .single()

    if (data && !error) {
      setCurrentRequest(data)
    }
    setTriggering(false)
    return !error
  }, [])

  const isRunning = currentRequest?.status === 'pending' || currentRequest?.status === 'running'

  return { triggerAudit, currentRequest, isRunning, triggering }
}

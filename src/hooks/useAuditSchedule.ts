'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface AuditSchedule {
  id: number
  enabled: boolean
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly'
  day_of_week: number | null
  day_of_month: number | null
  hour: number
  minute: number
  timezone: string
  last_triggered_at: string | null
  next_run_at: string | null
  created_at: string
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function getLocalTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'America/New_York'
  }
}

export function formatNextRun(schedule: AuditSchedule): string {
  if (!schedule.enabled) return 'Paused'
  if (schedule.next_run_at) {
    const d = new Date(schedule.next_run_at)
    return d.toLocaleString(undefined, {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
    })
  }
  return computeNextRunLabel(schedule)
}

function computeNextRunLabel(s: AuditSchedule): string {
  const timeStr = `${String(s.hour).padStart(2, '0')}:${String(s.minute).padStart(2, '0')}`
  if (s.frequency === 'daily') return `Daily at ${timeStr}`
  if (s.frequency === 'weekly' && s.day_of_week != null) {
    return `Every ${DAYS[s.day_of_week]} at ${timeStr}`
  }
  if (s.frequency === 'monthly' && s.day_of_month != null) {
    return `Monthly on the ${s.day_of_month}${ordinal(s.day_of_month)} at ${timeStr}`
  }
  return `${s.frequency} at ${timeStr}`
}

function ordinal(n: number): string {
  if (n > 3 && n < 21) return 'th'
  switch (n % 10) {
    case 1: return 'st'
    case 2: return 'nd'
    case 3: return 'rd'
    default: return 'th'
  }
}

export function useAuditSchedule() {
  const [schedule, setSchedule] = useState<AuditSchedule | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const fetchSchedule = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('audit_schedules')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    setSchedule(data ?? null)
    setLoading(false)
  }, [])

  useEffect(() => { fetchSchedule() }, [fetchSchedule])

  const saveSchedule = async (updates: Partial<AuditSchedule>) => {
    setSaving(true)
    try {
      if (schedule?.id) {
        const { data } = await supabase
          .from('audit_schedules')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', schedule.id)
          .select()
          .single()
        if (data) setSchedule(data)
      } else {
        const { data } = await supabase
          .from('audit_schedules')
          .insert({ ...updates })
          .select()
          .single()
        if (data) setSchedule(data)
      }
    } finally {
      setSaving(false)
    }
  }

  const toggleEnabled = async () => {
    if (!schedule) return
    await saveSchedule({ enabled: !schedule.enabled })
  }

  const deleteSchedule = async () => {
    if (!schedule) return
    await supabase.from('audit_schedules').delete().eq('id', schedule.id)
    setSchedule(null)
  }

  return { schedule, loading, saving, saveSchedule, toggleEnabled, deleteSchedule }
}

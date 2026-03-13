'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AuditRun, NegativeKeyword, KeywordExpansion, KeywordToPause } from '@/types'

export function useLatestAudit() {
  const [audit, setAudit] = useState<AuditRun | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('audit_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      setAudit(data)
      setLoading(false)
    }
    fetch()
  }, [])

  return { audit, loading }
}

type AuditHistoryRow = Pick<AuditRun, 'id' | 'run_date' | 'score' | 'grade' | 'passed_checks' | 'failed_checks' | 'created_at'>

export function useAuditHistory() {
  const [audits, setAudits] = useState<AuditHistoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('audit_runs')
        .select('id, run_date, score, grade, passed_checks, failed_checks, created_at')
        .order('run_date', { ascending: false })
        .limit(52)
      setAudits((data as AuditHistoryRow[]) ?? [])
      setLoading(false)
    }
    fetch()
  }, [])

  return { audits, loading }
}

export function useNegativeKeywords(auditRunId?: number) {
  const [keywords, setKeywords] = useState<NegativeKeyword[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetch() {
      let query = supabase.from('negative_keywords').select('*')
      if (auditRunId) query = query.eq('audit_run_id', auditRunId)
      query = query.order('cost', { ascending: false })
      const { data } = await query
      setKeywords(data ?? [])
      setLoading(false)
    }
    fetch()
  }, [auditRunId])

  const updateStatus = async (id: number, status: NegativeKeyword['status']) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('negative_keywords')
      .update({
        status,
        decided_by: user?.id ?? null,
        decided_at: new Date().toISOString(),
      })
      .eq('id', id)
    if (!error) {
      setKeywords(prev => prev.map(k => k.id === id ? { ...k, status } : k))
    }
    return !error
  }

  return { keywords, loading, updateStatus }
}

export function useKeywordExpansions(auditRunId?: number) {
  const [keywords, setKeywords] = useState<KeywordExpansion[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetch() {
      let query = supabase.from('keyword_expansions').select('*')
      if (auditRunId) query = query.eq('audit_run_id', auditRunId)
      query = query.order('conversions', { ascending: false })
      const { data } = await query
      setKeywords(data ?? [])
      setLoading(false)
    }
    fetch()
  }, [auditRunId])

  const updateStatus = async (id: number, status: KeywordExpansion['status']) => {
    const { error } = await supabase
      .from('keyword_expansions')
      .update({ status })
      .eq('id', id)
    if (!error) {
      setKeywords(prev => prev.map(k => k.id === id ? { ...k, status } : k))
    }
    return !error
  }

  return { keywords, loading, updateStatus }
}

export function useKeywordsToPause(auditRunId?: number) {
  const [keywords, setKeywords] = useState<KeywordToPause[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetch() {
      let query = supabase.from('keywords_to_pause').select('*')
      if (auditRunId) query = query.eq('audit_run_id', auditRunId)
      query = query.order('spend', { ascending: false })
      const { data } = await query
      setKeywords(data ?? [])
      setLoading(false)
    }
    fetch()
  }, [auditRunId])

  const updateStatus = async (id: number, status: KeywordToPause['status']) => {
    const { error } = await supabase
      .from('keywords_to_pause')
      .update({ status })
      .eq('id', id)
    if (!error) {
      setKeywords(prev => prev.map(k => k.id === id ? { ...k, status } : k))
    }
    return !error
  }

  return { keywords, loading, updateStatus }
}

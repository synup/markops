'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { TallyLead, LeadsFilters } from '@/types'

export function useLeads(filters: LeadsFilters) {
  const [leads, setLeads] = useState<TallyLead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const supabase = createClient()

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('tally_leads')
        .select('*', { count: 'exact' })
        .order('submitted_at', { ascending: false })

      if (filters.dateFrom) query = query.gte('submitted_at', `${filters.dateFrom}T00:00:00Z`)
      if (filters.dateTo) query = query.lte('submitted_at', `${filters.dateTo}T23:59:59Z`)
      if (filters.formName) query = query.eq('form_name', filters.formName)
      if (filters.employeeCount) query = query.eq('employee_count', filters.employeeCount)
      if (filters.businessType) query = query.eq('business_type', filters.businessType)
      if (filters.attributionSource) query = query.eq('attribution_source', filters.attributionSource)

      const { data, error: fetchError, count } = await query
      if (fetchError) throw new Error(fetchError.message)
      setLeads(data ?? [])
      setTotalCount(count ?? 0)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch leads')
    } finally {
      setLoading(false)
    }
  }, [
    filters.dateFrom, filters.dateTo, filters.formName,
    filters.employeeCount, filters.businessType, filters.attributionSource,
  ])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  return { leads, loading, error, totalCount, refetch: fetchLeads }
}

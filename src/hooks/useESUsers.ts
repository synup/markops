import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { WorkspaceUser } from '@/types/email-signatures'

interface UseESUsersOptions {
  search?: string
  department?: string
  orgUnit?: string
}

export function useESUsers(opts: UseESUsersOptions = {}) {
  const [users, setUsers] = useState<WorkspaceUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    let query = supabase
      .from('es_workspace_users')
      .select('*, es_signature_assignments(*, es_signatures(*))')
      .eq('is_active', true)
      .order('last_name')

    if (opts.search) {
      query = query.or(
        `first_name.ilike.%${opts.search}%,last_name.ilike.%${opts.search}%,email.ilike.%${opts.search}%`
      )
    }
    if (opts.department) query = query.eq('department', opts.department)
    if (opts.orgUnit) query = query.eq('org_unit', opts.orgUnit)

    const { data, error } = await query
    if (error) setError(error.message)
    else setUsers(data ?? [])
    setLoading(false)
  }, [opts.search, opts.department, opts.orgUnit])

  useEffect(() => { fetch() }, [fetch])
  return { users, loading, error, refetch: fetch }
}

export function useActiveESUserCount() {
  const [count, setCount] = useState<number | null>(null)
  useEffect(() => {
    const supabase = createClient()
    supabase.from('es_workspace_users').select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .then(({ count }) => setCount(count))
  }, [])
  return count
}

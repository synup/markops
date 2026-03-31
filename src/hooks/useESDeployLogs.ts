import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { DeployLog } from '@/types/email-signatures'

export function useESDeployLogs(limit = 20) {
  const [logs, setLogs] = useState<DeployLog[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const supabase = createClient()
    supabase.from('es_deploy_logs').select('*')
      .order('deployed_at', { ascending: false })
      .limit(limit)
      .then(({ data }) => { setLogs(data ?? []); setLoading(false) })
  }, [limit])
  return { logs, loading }
}

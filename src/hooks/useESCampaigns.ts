import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Campaign } from '@/types/email-signatures'

export function useESCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('es_campaigns')
      .select('*, es_signatures(name)')
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setCampaigns(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])
  return { campaigns, loading, error, refetch: fetch }
}

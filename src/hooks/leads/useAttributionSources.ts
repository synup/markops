'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useAttributionSources() {
  const [sources, setSources] = useState<string[]>([])
  const supabase = createClient()

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('tally_leads')
        .select('attribution_source')
        .not('attribution_source', 'is', null)
        .order('attribution_source')

      if (data) {
        const unique = [...new Set(data.map(d => d.attribution_source).filter(Boolean))]
        setSources(unique as string[])
      }
    }
    fetch()
  }, [])

  return sources
}

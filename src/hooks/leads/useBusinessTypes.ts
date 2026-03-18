'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useBusinessTypes() {
  const [types, setTypes] = useState<string[]>([])
  const supabase = createClient()

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('tally_leads')
        .select('business_type')
        .not('business_type', 'is', null)
        .order('business_type')

      if (data) {
        const unique = [...new Set(data.map(d => d.business_type).filter(Boolean))]
        setTypes(unique as string[])
      }
    }
    fetch()
  }, [])

  return types
}

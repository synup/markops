import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Signature } from '@/types/email-signatures'

export function useESSignatures() {
  const [signatures, setSignatures] = useState<Signature[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('es_signatures')
      .select('*, es_signature_assignments(count)')
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setSignatures(data?.map((s: Record<string, unknown>) => ({
      ...s,
      user_count: (s.es_signature_assignments as Array<{ count: number }>)?.[0]?.count ?? 0,
    })) as Signature[] ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])
  return { signatures, loading, error, refetch: fetch }
}

export function useESSignature(id: string) {
  const [signature, setSignature] = useState<Signature | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!id) { setLoading(false); return }
    const supabase = createClient()
    supabase.from('es_signatures').select('*').eq('id', id).single()
      .then(({ data }) => { setSignature(data); setLoading(false) })
  }, [id])
  return { signature, loading }
}

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deployAll } from '@/lib/google/deploySignature'
import { isServiceAccountConfigured } from '@/lib/google/auth'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!isServiceAccountConfigured()) {
    return NextResponse.json({ error: 'Service account not configured' }, { status: 400 })
  }

  try {
    const result = await deployAll(user.email!)
    return NextResponse.json(result)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

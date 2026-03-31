import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncWorkspaceUsers } from '@/lib/google/syncUsers'
import { isServiceAccountConfigured } from '@/lib/google/auth'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!isServiceAccountConfigured()) {
    return NextResponse.json(
      { error: 'Service account not configured. Add GOOGLE_SERVICE_ACCOUNT_JSON to env.' },
      { status: 400 }
    )
  }

  try {
    const result = await syncWorkspaceUsers()
    return NextResponse.json(result)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

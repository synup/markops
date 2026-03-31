import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { getAdminAuth, isServiceAccountConfigured } from '@/lib/google/auth'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!isServiceAccountConfigured()) {
    return NextResponse.json(
      { message: 'Service account not configured — add GOOGLE_SERVICE_ACCOUNT_JSON to env' },
      { status: 400 }
    )
  }
  try {
    const auth = getAdminAuth()
    const admin = google.admin({ version: 'directory_v1', auth })
    const res = await admin.users.list({ customer: 'my_customer', maxResults: 1 })
    const count = res.data.users?.length ?? 0
    return NextResponse.json({ message: `Connected — Google Workspace reachable (${count} user sample)` })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ message: msg }, { status: 500 })
  }
}

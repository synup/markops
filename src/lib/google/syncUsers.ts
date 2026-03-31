import { google } from 'googleapis'
import { getAdminAuth } from './auth'
import { createAdminClient } from '@/lib/supabase/admin'

interface GoogleUser {
  id: string
  primaryEmail: string
  name: { givenName: string; familyName: string }
  organizations?: Array<{ title?: string; department?: string }>
  phones?: Array<{ value: string; type: string }>
  orgUnitPath?: string
  suspended?: boolean
}

function extractPhones(user: GoogleUser) {
  const mobile = user.phones?.find(p => p.type === 'mobile')?.value ?? null
  const work = user.phones?.find(p => p.type === 'work')?.value ?? null
  return { mobile, work }
}

export async function syncWorkspaceUsers(): Promise<{ synced: number; errors: string[] }> {
  const auth = getAdminAuth()
  const admin = google.admin({ version: 'directory_v1', auth })
  const supabase = createAdminClient()
  const errors: string[] = []
  let synced = 0
  let pageToken: string | undefined

  do {
    const res = await admin.users.list({
      customer: 'my_customer',
      maxResults: 200,
      orderBy: 'email',
      pageToken,
      projection: 'full',
    })

    const users = (res.data.users ?? []) as GoogleUser[]
    pageToken = res.data.nextPageToken ?? undefined

    for (const u of users) {
      const { mobile, work } = extractPhones(u)
      const { error } = await supabase.from('es_workspace_users').upsert({
        google_id: u.id,
        email: u.primaryEmail,
        first_name: u.name?.givenName ?? null,
        last_name: u.name?.familyName ?? null,
        job_title: u.organizations?.[0]?.title ?? null,
        department: u.organizations?.[0]?.department ?? null,
        phone_mobile: mobile,
        phone_work: work,
        org_unit: u.orgUnitPath ?? null,
        is_active: !u.suspended,
        last_synced_at: new Date().toISOString(),
      }, { onConflict: 'google_id' })

      if (error) errors.push(`${u.primaryEmail}: ${error.message}`)
      else synced++
    }
  } while (pageToken)

  return { synced, errors }
}

import { google } from 'googleapis'
import { getUserAuth } from './auth'
import { buildSignatureHtml } from '@/lib/signatures/buildSignatureHtml'
import { createAdminClient } from '@/lib/supabase/admin'
import type { WorkspaceUser, Signature, Campaign, DeployResult } from '@/types/email-signatures'

async function pushSignatureToGmail(user: WorkspaceUser, html: string): Promise<void> {
  const auth = getUserAuth(user.email)
  const gmail = google.gmail({ version: 'v1', auth })
  await gmail.users.settings.sendAs.update({
    userId: 'me',
    sendAsEmail: user.email,
    requestBody: { signature: html, isDefault: true },
  })
}

export async function deployAll(deployedBy: string): Promise<{
  total: number; success: number; failed: number; results: DeployResult[]
}> {
  const supabase = createAdminClient()
  const now = new Date().toISOString()
  const results: DeployResult[] = []

  const { data: users, error: usersErr } = await supabase
    .from('es_workspace_users')
    .select('*')
    .eq('is_active', true)
  if (usersErr) throw new Error(usersErr.message)

  const { data: orgDefault } = await supabase
    .from('es_signatures')
    .select('*')
    .eq('is_org_default', true)
    .eq('status', 'active')
    .single()

  const { data: campaigns } = await supabase
    .from('es_campaigns')
    .select('*')
    .eq('is_active', true)
    .lte('start_date', now)
    .or(`end_date.is.null,end_date.gte.${now}`)

  const { data: assignments } = await supabase
    .from('es_signature_assignments')
    .select('*, es_signatures(*)')
    .eq('is_override', true)

  const overrideMap = new Map<string, Signature>(
    (assignments ?? []).map((a: Record<string, unknown>) => [a.user_id as string, a.es_signatures as Signature])
  )

  const campaignBySig = new Map<string, Campaign>()
  for (const c of (campaigns ?? []) as Campaign[]) {
    if (c.signature_id) campaignBySig.set(c.signature_id, c)
  }

  for (const user of (users ?? []) as WorkspaceUser[]) {
    try {
      const sig: Signature | null = overrideMap.get(user.id) ?? orgDefault ?? null
      if (!sig) {
        results.push({ email: user.email, status: 'failed', error: 'No signature assigned' })
        continue
      }
      const campaign = campaignBySig.get(sig.id) ?? null
      const html = buildSignatureHtml(sig, user, campaign)
      await pushSignatureToGmail(user, html)
      results.push({ email: user.email, status: 'success' })
    } catch (err: unknown) {
      results.push({
        email: user.email,
        status: 'failed',
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  const success = results.filter(r => r.status === 'success').length
  const failed = results.filter(r => r.status === 'failed').length

  await supabase.from('es_deploy_logs').insert({
    deployed_by: deployedBy,
    total_users: results.length,
    success_count: success,
    failure_count: failed,
    per_user_results: results,
  })

  return { total: results.length, success, failed, results }
}

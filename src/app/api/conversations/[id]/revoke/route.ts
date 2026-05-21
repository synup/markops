import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin()

    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'missing id' }, { status: 400 })
    }

    const admin = createAdminClient()

    // v1: revoke does NOT cancel pending/generating content_briefs rows that
    // may have been queued by a prior approve. The droplet worker will still
    // process them and write the result — a small orphan-brief inefficiency
    // we accept for now. Future enhancement: DELETE pending/generating briefs
    // for this call_insight on revoke.
    // Same applies to content_drafts — orphaned drafts accepted as v1
    // inefficiency, same cleanup path when we wire it.
    const { data, error } = await admin
      .from('call_insights')
      .update({
        review_status: 'pending',
        approved_asset_type: null,
        rejection_reason: null,
        reviewed_at: null,
      })
      .eq('id', id)
      .select('id, review_status, approved_asset_type, rejection_reason, reviewed_at')
      .maybeSingle()

    if (error) {
      console.error('PATCH revoke update failed:', error)
      return NextResponse.json({ error: 'update failed', detail: error.message }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: 'not found' }, { status: 404 })
    }
    return NextResponse.json({ row: data })
  } catch (err) {
    if (err instanceof Response) return err
    console.error('PATCH revoke error:', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}

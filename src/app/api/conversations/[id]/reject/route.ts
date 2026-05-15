import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createAdminClient } from '@/lib/supabase/admin'

const MAX_REASON_LEN = 1000

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin()

    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'missing id' }, { status: 400 })
    }

    let body: { rejection_reason?: unknown } = {}
    try {
      body = await request.json()
    } catch {
      // empty / non-JSON body is allowed (rejection_reason is optional)
    }

    let reason: string | null = null
    const raw = body.rejection_reason
    if (raw !== undefined && raw !== null) {
      if (typeof raw !== 'string') {
        return NextResponse.json(
          { error: 'rejection_reason must be string or null' },
          { status: 400 },
        )
      }
      const trimmed = raw.trim().slice(0, MAX_REASON_LEN)
      reason = trimmed === '' ? null : trimmed
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('call_insights')
      .update({
        review_status: 'rejected',
        rejection_reason: reason,
        approved_asset_type: null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, review_status, rejection_reason, approved_asset_type, reviewed_at')
      .maybeSingle()

    if (error) {
      console.error('PATCH reject update failed:', error)
      return NextResponse.json({ error: 'update failed', detail: error.message }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: 'not found' }, { status: 404 })
    }
    return NextResponse.json({ row: data })
  } catch (err) {
    if (err instanceof Response) return err
    console.error('PATCH reject error:', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}

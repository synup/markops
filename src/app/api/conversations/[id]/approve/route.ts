import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createAdminClient } from '@/lib/supabase/admin'

const VALID_ASSET_TYPES = new Set([
  'blog_post', 'deep_article', 'use_case', 'collateral', 'tool', 'thought_leadership',
])

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

    let body: { approved_asset_type?: unknown }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'invalid json body' }, { status: 400 })
    }

    const assetType = body.approved_asset_type
    if (typeof assetType !== 'string' || !VALID_ASSET_TYPES.has(assetType)) {
      return NextResponse.json(
        { error: 'invalid approved_asset_type', allowed: Array.from(VALID_ASSET_TYPES) },
        { status: 400 },
      )
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('call_insights')
      .update({
        review_status: 'approved',
        approved_asset_type: assetType,
        rejection_reason: null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, review_status, approved_asset_type, rejection_reason, reviewed_at')
      .maybeSingle()

    if (error) {
      console.error('PATCH approve update failed:', error)
      return NextResponse.json({ error: 'update failed', detail: error.message }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: 'not found' }, { status: 404 })
    }
    return NextResponse.json({ row: data })
  } catch (err) {
    if (err instanceof Response) return err
    console.error('PATCH approve error:', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}

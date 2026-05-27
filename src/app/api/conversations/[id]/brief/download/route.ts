import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createAdminClient } from '@/lib/supabase/admin'

// Phase 3b: serves the most-recent ready brief_content as a markdown
// attachment. The cyan "Download brief" button on Approved cards points
// here. Pairs with GET /api/conversations/[id]/brief (status endpoint).
export async function GET(
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
    const { data, error } = await admin
      .from('content_briefs')
      .select('id, asset_type, brief_content, ready_at')
      .eq('call_insight_id', id)
      .eq('status', 'ready')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('GET brief/download query failed:', error)
      return NextResponse.json({ error: 'query failed', detail: error.message }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json(
        { error: 'No ready brief found for this insight' },
        { status: 404 },
      )
    }
    if (!data.brief_content) {
      console.error('Ready brief has null brief_content:', { brief_id: data.id })
      return NextResponse.json({ error: 'Brief content missing' }, { status: 500 })
    }

    const filename = `brief-${data.asset_type}-${formatDateCompact(data.ready_at)}.md`
    return new Response(data.brief_content, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    if (err instanceof Response) return err
    console.error('GET brief/download error:', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}

function formatDateCompact(iso: string | null): string {
  if (!iso) return 'unknown'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'unknown'
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

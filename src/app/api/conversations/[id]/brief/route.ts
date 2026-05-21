import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createAdminClient } from '@/lib/supabase/admin'

// Phase 3b: returns the most-recent content_briefs row for a call_insight.
// Default shape (status + metadata only) drives the "Generating brief…" pill
// and the Download brief button enablement. Pass ?content=true to also
// include brief_content in the response — used by the in-app brief viewer
// modal (Phase 3b.5). The file download still goes through /download so
// browsers get a proper Content-Disposition.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin()

    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'missing id' }, { status: 400 })
    }

    const includeContent =
      new URL(request.url).searchParams.get('content') === 'true'

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('content_briefs')
      .select('id, asset_type, status, ready_at, error_message, brief_content, generation_metadata')
      .eq('call_insight_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('GET brief query failed:', error)
      return NextResponse.json({ error: 'query failed', detail: error.message }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ brief: null })
    }

    const briefContent = data.brief_content as string | null
    const metadata = data.generation_metadata as { output_tokens?: number | null } | null

    const brief: Record<string, unknown> = {
      id: data.id,
      asset_type: data.asset_type,
      status: data.status,
      chars: briefContent ? briefContent.length : null,
      ready_at: data.ready_at,
      output_tokens: metadata?.output_tokens ?? null,
      has_content: !!briefContent && briefContent.length > 0,
      error_message: data.error_message,
    }
    if (includeContent) {
      brief.brief_content = briefContent
    }

    return NextResponse.json({ brief })
  } catch (err) {
    if (err instanceof Response) return err
    console.error('GET brief error:', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}

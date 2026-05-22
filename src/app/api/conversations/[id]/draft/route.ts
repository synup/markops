import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createAdminClient } from '@/lib/supabase/admin'

const MAX_DRAFT_CHARS = 5_000

// Phase 3c: returns the most-recent content_drafts row for a call_insight.
// Default shape (status + metadata only) drives the "Generating draft…" pill
// and the View draft button enablement. Pass ?content=true to also include
// draft_content for the in-app editor modal.
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
      .from('content_drafts')
      .select('id, author_voice, status, ready_at, error_message, draft_content')
      .eq('call_insight_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('GET draft query failed:', error)
      return NextResponse.json({ error: 'query failed', detail: error.message }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ draft: null })
    }

    const draftContent = data.draft_content as string | null
    const draft: Record<string, unknown> = {
      id: data.id,
      author_voice: data.author_voice,
      status: data.status,
      chars: draftContent ? draftContent.length : null,
      ready_at: data.ready_at,
      error_message: data.error_message,
      has_content: !!draftContent && draftContent.length > 0,
    }
    if (includeContent) {
      draft.draft_content = draftContent
    }

    return NextResponse.json({ draft })
  } catch (err) {
    if (err instanceof Response) return err
    console.error('GET draft error:', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}

// PATCH updates the most-recent ready draft's content. v1 has no updated_by
// tracking — content_drafts doesn't carry that column (Niladri is the only
// editor; multi-editor support is a future migration).
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

    let body: { draft_content?: unknown }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'invalid json body' }, { status: 400 })
    }

    const content = body.draft_content
    if (typeof content !== 'string' || content.length === 0 || content.length > MAX_DRAFT_CHARS) {
      const detail = typeof content !== 'string' ? 'draft_content must be a string'
        : content.length === 0 ? 'draft_content cannot be empty'
        : `draft_content exceeds max length (${content.length} > ${MAX_DRAFT_CHARS})`
      return NextResponse.json({ error: detail }, { status: 400 })
    }

    const admin = createAdminClient()

    // Find the most-recent ready draft for this insight.
    const { data: target, error: lookupErr } = await admin
      .from('content_drafts')
      .select('id')
      .eq('call_insight_id', id)
      .eq('status', 'ready')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (lookupErr) {
      console.error('PATCH draft lookup failed:', lookupErr)
      return NextResponse.json({ error: 'lookup failed', detail: lookupErr.message }, { status: 500 })
    }
    if (!target) {
      return NextResponse.json({ error: 'No ready draft to edit' }, { status: 404 })
    }

    // updated_at is set by the migration 020 trigger; client doesn't send it.
    const { data: updated, error: updateErr } = await admin
      .from('content_drafts')
      .update({ draft_content: content })
      .eq('id', target.id)
      .select('id, author_voice, status, ready_at, error_message, draft_content')
      .maybeSingle()

    if (updateErr) {
      console.error('PATCH draft update failed:', updateErr)
      return NextResponse.json({ error: 'update failed', detail: updateErr.message }, { status: 500 })
    }
    if (!updated) {
      return NextResponse.json({ error: 'Draft not found after update' }, { status: 404 })
    }

    const updatedContent = (updated.draft_content as string | null) ?? ''
    return NextResponse.json({
      draft: {
        id: updated.id,
        author_voice: updated.author_voice,
        status: updated.status,
        chars: updatedContent.length,
        ready_at: updated.ready_at,
        error_message: updated.error_message,
        has_content: updatedContent.length > 0,
        draft_content: updatedContent,
      },
    })
  } catch (err) {
    if (err instanceof Response) return err
    console.error('PATCH draft error:', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}

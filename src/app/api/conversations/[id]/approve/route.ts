import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createAdminClient } from '@/lib/supabase/admin'

const VALID_ASSET_TYPES = new Set([
  'blog_post', 'deep_article', 'use_case', 'collateral', 'tool', 'thought_leadership',
])

// Asset types that route to the Phase 3b brief generator on the droplet.
// thought_leadership routes to Phase 3c (content_drafts) — see DRAFT_DEFAULT_VOICE below.
const LONG_FORM_ASSET_TYPES = new Set([
  'blog_post', 'deep_article', 'use_case', 'collateral', 'tool',
])

// Allowed author voices for thought_leadership drafts. Matches the
// content_drafts.author_voice CHECK constraint and content_draft_prompts seed.
const VALID_AUTHOR_VOICES = new Set(['sudy', 'roshan', 'niladri'])

// Fallback voice when the client doesn't provide author_voice or sends an
// invalid value. Soft-fallback (not a 400) so older callers / API consumers
// that pre-date the voice picker keep working.
const DRAFT_DEFAULT_VOICE = 'niladri'

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

    let body: { approved_asset_type?: unknown; author_voice?: unknown }
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

    // Resolve author_voice for the thought_leadership branch. Missing or
    // invalid values fall back to DRAFT_DEFAULT_VOICE rather than 400 — the
    // approve action itself is independent of voice.
    let authorVoice = DRAFT_DEFAULT_VOICE
    if (typeof body.author_voice === 'string' && VALID_AUTHOR_VOICES.has(body.author_voice)) {
      authorVoice = body.author_voice
    } else if (body.author_voice !== undefined) {
      console.warn(
        `approve: invalid author_voice ${JSON.stringify(body.author_voice)} — falling back to ${DRAFT_DEFAULT_VOICE}`,
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

    // Best-effort: queue a brief for the droplet worker. Failures here are
    // logged but never break the approve response — the brief can be
    // re-inserted manually later.
    if (LONG_FORM_ASSET_TYPES.has(assetType)) {
      try {
        const { data: existing, error: lookupErr } = await admin
          .from('content_briefs')
          .select('id')
          .eq('call_insight_id', data.id)
          .eq('asset_type', assetType)
          .in('status', ['pending', 'generating'])
          .limit(1)
          .maybeSingle()

        if (lookupErr) {
          console.error('content_briefs lookup failed (continuing):', lookupErr)
        } else if (!existing) {
          const { error: insertErr } = await admin
            .from('content_briefs')
            .insert({
              call_insight_id: data.id,
              asset_type: assetType,
              status: 'pending',
            })
          if (insertErr) {
            console.error('content_briefs insert failed (continuing):', insertErr)
          }
        }
      } catch (briefErr) {
        console.error('content_briefs queue step threw (continuing):', briefErr)
      }
    }

    // Best-effort: queue a thought_leadership draft for the droplet worker.
    // Idempotency includes 'ready' (unlike briefs) — a successful generation
    // shouldn't trigger a duplicate on re-approve. Failures swallowed; the
    // approve response stays successful regardless.
    if (assetType === 'thought_leadership') {
      try {
        const { data: existing, error: lookupErr } = await admin
          .from('content_drafts')
          .select('id')
          .eq('call_insight_id', data.id)
          .eq('author_voice', authorVoice)
          .in('status', ['pending', 'generating', 'ready'])
          .limit(1)
          .maybeSingle()

        if (lookupErr) {
          console.error('content_drafts lookup failed (continuing):', lookupErr)
        } else if (!existing) {
          const { error: insertErr } = await admin
            .from('content_drafts')
            .insert({
              call_insight_id: data.id,
              author_voice: authorVoice,
              status: 'pending',
            })
          if (insertErr) {
            console.error('content_drafts insert failed (continuing):', insertErr)
          }
        }
      } catch (draftErr) {
        console.error('content_drafts queue step threw (continuing):', draftErr)
      }
    }

    return NextResponse.json({ row: data })
  } catch (err) {
    if (err instanceof Response) return err
    console.error('PATCH approve error:', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}

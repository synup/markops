import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createAdminClient } from '@/lib/supabase/admin'

const VALID_PROMPT_NAMES = new Set([
  'base', 'sudy', 'roshan', 'niladri',
])
const MAX_PROMPT_CHARS = 100_000

// Phase 3c item 5: updates a single draft prompt's content. updated_by is
// pulled from the admin session email (falls back to body override or
// 'admin'). updated_at is set by the migration 020 set_updated_at trigger.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  try {
    const { user } = await requireAdmin()

    const { name } = await params
    if (!VALID_PROMPT_NAMES.has(name)) {
      return NextResponse.json({ error: 'Invalid prompt name' }, { status: 400 })
    }

    let body: { prompt_content?: unknown; updated_by?: unknown }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'invalid json body' }, { status: 400 })
    }

    const content = body.prompt_content
    if (typeof content !== 'string') {
      return NextResponse.json(
        { error: 'prompt_content must be a string' },
        { status: 400 },
      )
    }
    if (content.length === 0) {
      return NextResponse.json(
        { error: 'prompt_content cannot be empty' },
        { status: 400 },
      )
    }
    if (content.length > MAX_PROMPT_CHARS) {
      return NextResponse.json(
        { error: `prompt_content exceeds max length (${content.length} > ${MAX_PROMPT_CHARS})` },
        { status: 400 },
      )
    }

    const bodyUpdatedBy =
      typeof body.updated_by === 'string' && body.updated_by ? body.updated_by : null
    const updatedBy = bodyUpdatedBy ?? user.email ?? 'admin'

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('content_draft_prompts')
      .update({ prompt_content: content, updated_by: updatedBy })
      .eq('prompt_name', name)
      .select('id, prompt_name, prompt_content, updated_by, updated_at')
      .maybeSingle()

    if (error) {
      console.error('PATCH draft-prompts update failed:', error)
      return NextResponse.json(
        { error: 'update failed', detail: error.message },
        { status: 500 },
      )
    }
    if (!data) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
    }

    const updatedContent = (data.prompt_content as string | null) ?? ''
    return NextResponse.json({
      prompt: {
        id: data.id,
        prompt_name: data.prompt_name,
        prompt_content: updatedContent,
        chars: updatedContent.length,
        updated_by: data.updated_by,
        updated_at: data.updated_at,
      },
    })
  } catch (err) {
    if (err instanceof Response) return err
    console.error('PATCH draft-prompts error:', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createAdminClient } from '@/lib/supabase/admin'

// Phase 3b.5: returns all 6 brief prompts (base + 5 asset types) so the
// Agents-tab editor can render every row in one shot. chars is computed
// server-side from prompt_content.length.
export async function GET() {
  try {
    await requireAdmin()

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('content_brief_prompts')
      .select('id, prompt_name, prompt_content, updated_by, updated_at')
      .order('prompt_name', { ascending: true })

    if (error) {
      console.error('GET brief-prompts query failed:', error)
      return NextResponse.json({ error: 'query failed', detail: error.message }, { status: 500 })
    }

    const prompts = (data ?? []).map(p => {
      const content = (p.prompt_content as string | null) ?? ''
      return {
        id: p.id,
        prompt_name: p.prompt_name,
        prompt_content: content,
        chars: content.length,
        updated_by: p.updated_by,
        updated_at: p.updated_at,
      }
    })

    return NextResponse.json({ prompts })
  } catch (err) {
    if (err instanceof Response) return err
    console.error('GET brief-prompts error:', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('ai_visibility_runs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ run: data })
  } catch (error) {
    console.error('Failed to fetch AI visibility run:', error)
    return NextResponse.json({ error: 'Failed to fetch run status' }, { status: 500 })
  }
}

export async function POST() {
  try {
    const supabase = await createClient()

    // Get active keyword count
    const { count } = await supabase
      .from('ai_visibility_keywords')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    const { data, error } = await supabase
      .from('ai_visibility_runs')
      .insert({
        status: 'pending',
        trigger_source: 'manual',
        total_keywords: count ?? 0,
        models_queried: ['gpt-4o', 'claude-sonnet'],
        reps_per_keyword: 3,
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // TODO: Wire up droplet trigger (SSH or HTTP call to start fetch_ai_visibility.py)

    return NextResponse.json({ run: data })
  } catch (error) {
    console.error('Failed to trigger AI visibility run:', error)
    return NextResponse.json({ error: 'Failed to trigger run' }, { status: 500 })
  }
}

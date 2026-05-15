import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'

const VALID_TABS = new Set(['pending', 'approved', 'rejected'])
const VALID_CONV_TYPES = new Set(['sales', 'cs', 'unknown'])
const VALID_BRACKETS = new Set(['high', 'medium', 'low'])
const VALID_SORTS = new Set(['score', 'recent'])

const ROW_SELECT = `
  id, call_id,
  attribution_category, attribution_detail, attribution_asked, attribution_confidence,
  problem_statement, problem_specificity_score,
  suggested_asset_type, asset_rationale,
  icp_fit_score, problem_clarity_score, reusability_score, novelty_score,
  composite_score,
  marketing_summary, customer_verbatim,
  suggested_conversation_type, conversation_type_confidence, suggested_author,
  review_status, reviewed_at, approved_asset_type, rejection_reason,
  extracted_at, model_version,
  sales_calls!inner (
    id, external_meeting_id, title, call_date,
    rep_name, rep_email, customer_name, customer_company, customer_email,
    pipeline, conversation_type, call_duration_seconds, status
  )
`

export async function GET(request: Request) {
  try {
    const { supabase } = await requireAdmin()

    const { searchParams } = new URL(request.url)
    const tab = searchParams.get('tab') || 'pending'
    if (!VALID_TABS.has(tab)) {
      return NextResponse.json({ error: 'invalid tab' }, { status: 400 })
    }

    const conversationType = searchParams.get('conversation_type')
    if (conversationType && !VALID_CONV_TYPES.has(conversationType)) {
      return NextResponse.json({ error: 'invalid conversation_type' }, { status: 400 })
    }

    const bracket = searchParams.get('bracket')
    if (bracket && !VALID_BRACKETS.has(bracket)) {
      return NextResponse.json({ error: 'invalid bracket' }, { status: 400 })
    }

    const sort = searchParams.get('sort') || (tab === 'pending' ? 'score' : 'recent')
    if (!VALID_SORTS.has(sort)) {
      return NextResponse.json({ error: 'invalid sort' }, { status: 400 })
    }

    let rowsQuery = supabase
      .from('call_insights')
      .select(ROW_SELECT)
      .eq('review_status', tab)

    if (conversationType) {
      rowsQuery = rowsQuery.eq('sales_calls.conversation_type', conversationType)
    }
    if (bracket === 'high') {
      rowsQuery = rowsQuery.gte('composite_score', 18)
    } else if (bracket === 'medium') {
      rowsQuery = rowsQuery.gte('composite_score', 12).lt('composite_score', 18)
    } else if (bracket === 'low') {
      rowsQuery = rowsQuery.or('composite_score.lt.12,composite_score.is.null')
    }

    if (sort === 'score') {
      rowsQuery = rowsQuery.order('composite_score', { ascending: false, nullsFirst: false })
    } else {
      const col = tab === 'pending' ? 'extracted_at' : 'reviewed_at'
      rowsQuery = rowsQuery.order(col, { ascending: false, nullsFirst: false })
    }

    const { data: rows, error: rowsError } = await rowsQuery
    if (rowsError) {
      console.error('GET /api/conversations rows query failed:', rowsError)
      return NextResponse.json({ error: 'query failed', detail: rowsError.message }, { status: 500 })
    }

    const [pendingC, approvedC, rejectedC] = await Promise.all([
      supabase.from('call_insights').select('id', { count: 'exact', head: true }).eq('review_status', 'pending'),
      supabase.from('call_insights').select('id', { count: 'exact', head: true }).eq('review_status', 'approved'),
      supabase.from('call_insights').select('id', { count: 'exact', head: true }).eq('review_status', 'rejected'),
    ])

    return NextResponse.json({
      rows: rows || [],
      counts: {
        pending: pendingC.count ?? 0,
        approved: approvedC.count ?? 0,
        rejected: rejectedC.count ?? 0,
      },
    })
  } catch (err) {
    if (err instanceof Response) return err
    console.error('GET /api/conversations error:', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}

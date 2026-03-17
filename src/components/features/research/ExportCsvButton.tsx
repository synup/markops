'use client'

import type { ToolIdea, ContentIdea } from '@/hooks/useRedditResearch'

type ExportType = 'tool' | 'content'

interface ExportCsvButtonProps {
  type: ExportType
  ideas: ToolIdea[] | ContentIdea[]
}

export function ExportCsvButton({ type, ideas }: ExportCsvButtonProps) {
  const handleExport = () => {
    const rows = type === 'tool'
      ? buildToolRows(ideas as ToolIdea[])
      : buildContentRows(ideas as ContentIdea[])

    if (!rows.length) return

    const headers = rows[0] ? Object.keys(rows[0]) : []
    const csv = [
      headers.join(','),
      ...rows.map(row => headers.map(h => escapeCsv(String(row[h] ?? ''))).join(',')),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${type}_ideas_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      disabled={!ideas.length}
      className="btn-research rounded px-2.5 py-1 text-xs font-medium"
      style={{
        background: 'var(--surface-2)',
        color: ideas.length ? 'var(--text-muted)' : 'var(--text-dim)',
        border: '1px solid var(--border)',
        cursor: ideas.length ? 'pointer' : 'not-allowed',
      }}
    >
      Export CSV
    </button>
  )
}

function buildToolRows(ideas: ToolIdea[]): Record<string, string | number | boolean>[] {
  return ideas.map(i => ({
    title: i.post.title,
    subreddit: i.post.subreddit,
    url: i.post.url,
    composite_score: i.composite_score,
    relevance: i.relevance_score,
    intent: i.intent_score,
    engagement: i.engagement_score,
    competitive_gap: i.competitive_gap_score,
    build_complexity: i.build_complexity ?? '',
    tool_type: i.tool_type ?? '',
    recommended_action: i.latest_action?.action ?? 'pending',
    action_rationale: i.action_rationale ?? '',
  }))
}

function buildContentRows(ideas: ContentIdea[]): Record<string, string | number | boolean>[] {
  return ideas.map(i => ({
    title: i.post.title,
    subreddit: i.post.subreddit,
    url: i.post.url,
    composite_score: i.composite_score,
    relevance: i.relevance_score,
    search_demand: i.search_demand_score,
    engagement: i.engagement_score,
    competitive_gap: i.competitive_gap_score,
    icp_match: i.icp_match,
    content_cluster: i.content_cluster ?? '',
    content_type: i.content_type ?? '',
    target_keywords: (i.target_keywords ?? []).join('; '),
    recommended_action: i.latest_action?.action ?? 'pending',
    action_rationale: i.action_rationale ?? '',
  }))
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

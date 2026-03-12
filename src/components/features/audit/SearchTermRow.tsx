'use client'

interface SearchTermRowProps {
  term: {
    id: number
    search_term: string
    campaign: string
    impressions: number
    clicks: number
    cost: number
    conversions: number
    ctr: number
    categories: string[]
    reasons: string[]
    suggested_match_type: string | null
    term_type: string
  }
  onAddAsNegative?: (termId: number, term: string, campaign: string) => void
}

function typeColor(type: string): string {
  if (type === 'negative_candidate') return 'var(--red)'
  if (type === 'expansion_candidate') return 'var(--green)'
  if (type === 'wasted_spend') return 'var(--orange)'
  return 'var(--text-dim)'
}

function typeLabel(type: string): string {
  if (type === 'negative_candidate') return '− Negative'
  if (type === 'expansion_candidate') return '+ Expand'
  if (type === 'wasted_spend') return '⚠ Waste'
  return '—'
}

export function SearchTermRow({ term, onAddAsNegative }: SearchTermRowProps) {
  const showAddNeg = term.term_type === 'negative_candidate' || term.term_type === 'wasted_spend'

  return (
    <div
      className="flex items-center gap-3 rounded-lg px-4 py-2.5"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      {/* Type badge */}
      <span
        className="w-[70px] shrink-0 rounded px-2 py-0.5 text-center text-[10px] font-semibold"
        style={{ color: typeColor(term.term_type), background: `${typeColor(term.term_type)}15` }}
      >
        {typeLabel(term.term_type)}
      </span>

      {/* Term + campaign */}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium" style={{ color: 'var(--text)' }}>
          {term.search_term}
        </div>
        <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
          <span>{term.campaign}</span>
          {term.categories?.length > 0 && (
            <span style={{ color: 'var(--text-dim)' }}>· {term.categories.join(', ')}</span>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div className="flex items-center gap-4 text-xs">
        <div className="w-14 text-center">
          <div style={{ color: 'var(--text-dim)' }}>Impr</div>
          <div style={{ color: 'var(--text)' }}>{term.impressions.toLocaleString()}</div>
        </div>
        <div className="w-12 text-center">
          <div style={{ color: 'var(--text-dim)' }}>Clicks</div>
          <div style={{ color: 'var(--text)' }}>{term.clicks}</div>
        </div>
        <div className="w-14 text-center">
          <div style={{ color: 'var(--text-dim)' }}>Cost</div>
          <div style={{ color: 'var(--red)' }}>${term.cost.toFixed(2)}</div>
        </div>
        <div className="w-12 text-center">
          <div style={{ color: 'var(--text-dim)' }}>Conv</div>
          <div style={{ color: term.conversions > 0 ? 'var(--green)' : 'var(--text-dim)' }}>
            {term.conversions}
          </div>
        </div>
      </div>

      {/* Add as negative button */}
      {showAddNeg && onAddAsNegative && (
        <button
          onClick={() => onAddAsNegative(term.id, term.search_term, term.campaign)}
          className="shrink-0 rounded px-3 py-1 text-[11px] font-medium transition-colors hover:opacity-80"
          style={{ background: 'var(--red-muted)', color: 'var(--red)' }}
        >
          + Add Negative
        </button>
      )}
    </div>
  )
}

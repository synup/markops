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
  selected: boolean
  alreadyAdded: boolean
  onToggleSelect: () => void
}

function typeColor(type: string): string {
  if (type === 'negative_candidate') return '#EF4444'
  if (type === 'expansion_candidate') return '#22C55E'
  if (type === 'wasted_spend') return '#F97316'
  return 'var(--text-dim)'
}

function typeLabel(type: string): string {
  if (type === 'negative_candidate') return '- Negative'
  if (type === 'expansion_candidate') return '+ Expand'
  if (type === 'wasted_spend') return '! Waste'
  return '-'
}

export function SearchTermRow({ term, selected, alreadyAdded, onToggleSelect }: SearchTermRowProps) {
  const isNegType = term.term_type === 'negative_candidate' || term.term_type === 'wasted_spend'
  const selectable = isNegType && !alreadyAdded

  return (
    <div
      className="flex items-center gap-3 rounded-lg px-4 py-2.5 transition-colors"
      style={{
        background: alreadyAdded ? 'rgba(34,197,94,0.05)' : selected ? 'rgba(239,68,68,0.08)' : 'var(--surface)',
        border: alreadyAdded ? '1px solid rgba(34,197,94,0.2)' : selected ? '1px solid rgba(239,68,68,0.3)' : '1px solid var(--border)',
        cursor: selectable ? 'pointer' : 'default',
        opacity: alreadyAdded ? 0.6 : 1,
      }}
      onClick={selectable ? onToggleSelect : undefined}
    >
      {/* Checkbox or added badge */}
      {alreadyAdded ? (
        <span className="shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold"
          style={{ background: 'rgba(34,197,94,0.15)', color: '#22C55E' }}>
          Added
        </span>
      ) : isNegType ? (
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          onClick={e => e.stopPropagation()}
          className="h-4 w-4 shrink-0 accent-red-500"
        />
      ) : null}

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
          {Array.isArray(term.categories) && term.categories.length > 0 && (
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
          <div style={{ color: '#EF4444' }}>${term.cost.toFixed(2)}</div>
        </div>
        <div className="w-12 text-center">
          <div style={{ color: 'var(--text-dim)' }}>Conv</div>
          <div style={{ color: term.conversions > 0 ? '#22C55E' : 'var(--text-dim)' }}>
            {term.conversions}
          </div>
        </div>
      </div>

      {/* Match type hint */}
      {isNegType && !alreadyAdded && term.suggested_match_type && (
        <span className="shrink-0 text-[10px]" style={{ color: 'var(--text-dim)' }}>
          {term.suggested_match_type}
        </span>
      )}
    </div>
  )
}

'use client'

import type { ConversationType } from '@/types/conversation'
import type { useUrlState, Bracket } from '@/hooks/useUrlState'

type UrlReturn = ReturnType<typeof useUrlState>

const CT_OPTS: Array<{ value: ConversationType | ''; label: string }> = [
  { value: '',        label: 'All types' },
  { value: 'sales',   label: 'Sales' },
  { value: 'cs',      label: 'CS' },
  { value: 'unknown', label: 'Unknown' },
]

const BR_OPTS: Array<{ value: Bracket | ''; label: string }> = [
  { value: '',       label: 'All scores' },
  { value: 'high',   label: '≥18 (High)' },
  { value: 'medium', label: '12–17 (Medium)' },
  { value: 'low',    label: '<12 (Low / null)' },
]

const selectCls =
  'rounded-md border-[0.5px] border-slate-300 bg-white px-3 py-1.5 text-[13px] text-slate-700 ' +
  'transition-colors duration-150 hover:border-slate-400 focus:border-cyan-500 focus:outline-none'

export function ConversationsFilters({ url }: { url: UrlReturn }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <select
        value={url.conversationType ?? ''}
        onChange={e =>
          url.setConversationType(e.target.value ? (e.target.value as ConversationType) : null)
        }
        className={selectCls}
        aria-label="Filter by conversation type"
      >
        {CT_OPTS.map((o, i) => (
          <option key={i} value={o.value}>{o.label}</option>
        ))}
      </select>
      <select
        value={url.bracket ?? ''}
        onChange={e =>
          url.setBracket(e.target.value ? (e.target.value as Bracket) : null)
        }
        className={selectCls}
        aria-label="Filter by score bracket"
      >
        {BR_OPTS.map((o, i) => (
          <option key={i} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

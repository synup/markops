import { type ConversationRow } from '@/types/conversation'
import { ScoreBadge } from '@/components/ui/ScoreBadge'

type ScoreKey =
  | 'icp_fit_score'
  | 'problem_clarity_score'
  | 'problem_specificity_score'
  | 'reusability_score'
  | 'novelty_score'

const DIMS: Array<{ key: ScoreKey; label: string }> = [
  { key: 'icp_fit_score',             label: 'ICP fit' },
  { key: 'problem_clarity_score',     label: 'Problem clarity' },
  { key: 'problem_specificity_score', label: 'Specificity' },
  { key: 'reusability_score',         label: 'Reusability' },
  { key: 'novelty_score',             label: 'Novelty' },
]

export function DrawerScores({ row }: { row: ConversationRow }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[14px] font-medium text-slate-700">Scores</h3>
        <ScoreBadge score={row.composite_score} />
      </div>
      <div className="space-y-2">
        {DIMS.map(d => {
          const v = row[d.key]
          const pct = v != null ? Math.max(0, Math.min(100, (v / 5) * 100)) : 0
          return (
            <div key={d.key} className="flex items-center gap-3">
              <div className="w-28 shrink-0 text-[13px] text-slate-500">{d.label}</div>
              <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="absolute inset-y-0 left-0 bg-cyan-500 transition-[width] duration-200"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="w-8 shrink-0 text-right text-[13px] tabular-nums text-slate-700">
                {v ?? '—'}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

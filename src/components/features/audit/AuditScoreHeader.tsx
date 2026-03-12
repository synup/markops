'use client'

import { ScoreGauge } from '@/components/ui/ScoreGauge'
import { CategoryBar } from '@/components/ui/CategoryBar'
import type { AuditRun, AuditCategory } from '@/types'

interface AuditScoreHeaderProps {
  audit: AuditRun
}

export function AuditScoreHeader({ audit }: AuditScoreHeaderProps) {
  const cats = Array.isArray(audit.categories) ? audit.categories
    : typeof audit.categories === 'string' ? JSON.parse(audit.categories) : []

  return (
    <div className="px-6 py-4">
      {/* Top row: score + date */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
            Adwords Audit Report
          </h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Run date: {new Date(audit.run_date).toLocaleDateString('en-US', {
              month: 'long', day: 'numeric', year: 'numeric'
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
            {audit.passed_checks ?? 0}/{audit.total_checks ?? 0} checks passed
          </span>
        </div>
      </div>

      {/* Score + Categories grid */}
      <div className="flex gap-6">
        <ScoreGauge score={audit.score} grade={audit.grade} size="lg" />
        <div className="grid flex-1 grid-cols-3 gap-3">
          {cats.map((cat: AuditCategory) => (
            <CategoryBar key={cat.name} category={cat} />
          ))}
        </div>
      </div>
    </div>
  )
}

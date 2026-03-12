'use client'

import { ScoreGauge } from '@/components/ui/ScoreGauge'
import { CategoryBar } from '@/components/ui/CategoryBar'
import type { AuditRun } from '@/types'

interface AuditScoreHeaderProps {
  audit: AuditRun
}

export function AuditScoreHeader({ audit }: AuditScoreHeaderProps) {
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
            {audit.passed_checks}/{audit.total_checks} checks passed
          </span>
        </div>
      </div>

      {/* Score + Categories grid */}
      <div className="flex gap-6">
        <ScoreGauge score={audit.score} grade={audit.grade} size="lg" />
        <div className="grid flex-1 grid-cols-3 gap-3">
          {audit.categories.map(cat => (
            <CategoryBar key={cat.name} category={cat} />
          ))}
        </div>
      </div>
    </div>
  )
}

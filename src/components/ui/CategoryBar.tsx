import type { AuditCategory } from '@/types'

interface CategoryBarProps {
  category: AuditCategory
}

function scoreColor(score: number): string {
  if (score >= 80) return 'var(--green)'
  if (score >= 60) return 'var(--yellow)'
  if (score >= 40) return 'var(--orange)'
  return 'var(--red)'
}

export function CategoryBar({ category }: CategoryBarProps) {
  const color = scoreColor(category.score)
  const pct = Math.min(100, Math.max(0, category.score))

  return (
    <div
      className="rounded-lg p-3"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>
          {category.name}
        </span>
        <span className="text-xs font-bold" style={{ color }}>
          {category.score.toFixed(0)}%
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--surface-3)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <div className="mt-1 text-[10px]" style={{ color: 'var(--text-dim)' }}>
        Weight: {(category.weight * 100).toFixed(0)}%
      </div>
    </div>
  )
}

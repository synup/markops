'use client'

import { Calendar } from 'lucide-react'

interface DateRangePickerProps {
  range: string
  onRangeChange: (range: string) => void
}

const RANGES = ['7d', '14d', '30d', '90d']
const LABELS: Record<string, string> = { '7d': '7 days', '14d': '14 days', '30d': '30 days', '90d': '90 days' }

export function DateRangePicker({ range, onRangeChange }: DateRangePickerProps) {
  return (
    <div className="flex items-center gap-2">
      <Calendar className="w-4 h-4" style={{ color: 'var(--text-dim)' }} />
      <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: 'var(--surface-2)' }}>
        {RANGES.map(r => (
          <button
            key={r}
            onClick={() => onRangeChange(r)}
            className="px-3 py-1 rounded-md text-xs font-medium transition-colors"
            style={{
              background: range === r ? 'var(--surface)' : 'transparent',
              color: range === r ? 'var(--text)' : 'var(--text-muted)',
              boxShadow: range === r ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
            }}
          >
            {LABELS[r]}
          </button>
        ))}
      </div>
    </div>
  )
}

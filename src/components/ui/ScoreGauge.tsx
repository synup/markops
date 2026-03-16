'use client'

interface ScoreGaugeProps {
  score: number
  grade: string
  size?: 'sm' | 'lg'
}

function gradeColor(grade: string): string {
  if (grade === 'A') return 'var(--green)'
  if (grade === 'B') return 'var(--blue)'
  if (grade === 'C') return 'var(--yellow)'
  if (grade === 'D') return 'var(--orange)'
  return 'var(--red)'
}

export function ScoreGauge({ score, grade, size = 'lg' }: ScoreGaugeProps) {
  const color = gradeColor(grade)
  const dim = size === 'lg' ? 120 : 64
  const stroke = size === 'lg' ? 8 : 5
  const radius = (dim - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: dim, height: dim }}>
      <svg width={dim} height={dim} className="-rotate-90">
        <circle cx={dim / 2} cy={dim / 2} r={radius} fill="none"
          stroke="var(--surface-3)" strokeWidth={stroke} />
        <circle cx={dim / 2} cy={dim / 2} r={radius} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      <div className="absolute text-center">
        <div className="font-bold" style={{ color, fontSize: size === 'lg' ? '28px' : '16px' }}>
          {score.toFixed(1)}
        </div>
        <div className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
          Grade {grade}
        </div>
      </div>
    </div>
  )
}

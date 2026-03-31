import type { DeployLog } from '@/types/email-signatures'

export function DeployStats({ logs }: { logs: DeployLog[] }) {
  const totalDeploys = logs.length
  const totalSuccess = logs.reduce((s, l) => s + l.success_count, 0)
  const totalFailed = logs.reduce((s, l) => s + l.failure_count, 0)

  const stats = [
    { label: 'Total deploys', value: totalDeploys, color: 'var(--text)' },
    { label: 'Successful pushes', value: totalSuccess, color: 'var(--green)' },
    { label: 'Failed pushes', value: totalFailed, color: totalFailed > 0 ? 'var(--red)' : 'var(--text-dim)' },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map(s => (
        <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
        </div>
      ))}
    </div>
  )
}

'use client'

import { format } from 'date-fns'
import { useESDeployLogs } from '@/hooks/useESDeployLogs'
import { DeployStats } from './DeployStats'

export function DeployHistoryTable() {
  const { logs, loading } = useESDeployLogs()

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 rounded-lg animate-pulse" style={{ background: 'var(--surface-2)' }} />
        ))}
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No deployments yet. Deploy signatures to see history here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <DeployStats logs={logs} />
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--surface-2)' }}>
              {['Date', 'Deployed by', 'Total', 'Success', 'Failed'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} style={{ borderTop: '1px solid var(--border)' }}>
                <td className="px-4 py-3" style={{ color: 'var(--text)' }}>
                  {format(new Date(log.deployed_at), 'MMM d, yyyy h:mm a')}
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{log.deployed_by}</td>
                <td className="px-4 py-3" style={{ color: 'var(--text)' }}>{log.total_users}</td>
                <td className="px-4 py-3" style={{ color: 'var(--green)' }}>{log.success_count}</td>
                <td className="px-4 py-3" style={{ color: log.failure_count > 0 ? 'var(--red)' : 'var(--text-dim)' }}>
                  {log.failure_count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

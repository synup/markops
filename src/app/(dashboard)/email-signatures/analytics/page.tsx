import { DeployHistoryTable } from '@/components/email-signatures/analytics/DeployHistoryTable'

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Analytics</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Deploy history and per-user signature push results.
        </p>
      </div>
      <DeployHistoryTable />
    </div>
  )
}

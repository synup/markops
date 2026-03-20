'use client'

import { Topbar } from '@/components/layout/Topbar'
import { HeartbeatPanel } from '@/components/features/errors/HeartbeatPanel'
import { ErrorLogList } from '@/components/features/errors/ErrorLogList'

export default function ErrorsPage() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Topbar title="Error Logs" subtitle="Monitor backend job health and errors" />

      <div className="flex-1 overflow-y-auto p-6" style={{ background: 'var(--bg)' }}>
        {/* Heartbeat status cards */}
        <section className="mb-6">
          <h2
            className="mb-3 text-sm font-semibold uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            Job Health
          </h2>
          <HeartbeatPanel />
        </section>

        {/* Error log list */}
        <section>
          <h2
            className="mb-3 text-sm font-semibold uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            Error Log
          </h2>
          <ErrorLogList />
        </section>
      </div>
    </div>
  )
}

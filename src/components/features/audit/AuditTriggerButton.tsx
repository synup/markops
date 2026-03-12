'use client'

import { useAuditTrigger } from '@/hooks/useAuditTrigger'

export function AuditTriggerButton() {
  const { triggerAudit, currentRequest, isRunning, triggering } = useAuditTrigger()

  const statusText = () => {
    if (triggering) return 'Submitting...'
    if (currentRequest?.status === 'pending') return 'Queued — waiting for droplet...'
    if (currentRequest?.status === 'running') return 'Audit running...'
    if (currentRequest?.status === 'failed') return `Failed: ${currentRequest.error_message ?? 'Unknown error'}`
    return null
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={triggerAudit}
        disabled={isRunning || triggering}
        className="rounded-lg px-4 py-2 text-xs font-semibold text-white transition-opacity disabled:opacity-50"
        style={{ background: isRunning ? 'var(--surface-3)' : 'var(--brand)' }}
      >
        {isRunning ? '⟳ Running...' : '▶ Run Audit Now'}
      </button>

      {statusText() && (
        <span
          className="text-xs"
          style={{ color: currentRequest?.status === 'failed' ? 'var(--red)' : 'var(--text-muted)' }}
        >
          {statusText()}
        </span>
      )}

      {currentRequest?.status === 'completed' && (
        <span className="text-xs" style={{ color: 'var(--green)' }}>
          ✓ Last audit completed {new Date(currentRequest.completed_at!).toLocaleTimeString()}
        </span>
      )}
    </div>
  )
}

'use client'

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div
      className="rounded-lg"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div
          className="h-3 w-40 animate-pulse rounded"
          style={{ background: 'var(--surface-2)' }}
        />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <div
              className="h-3 flex-1 animate-pulse rounded"
              style={{ background: 'var(--surface-2)', opacity: 1 - i * 0.1 }}
            />
            <div
              className="h-3 w-16 animate-pulse rounded"
              style={{ background: 'var(--surface-2)', opacity: 1 - i * 0.1 }}
            />
            <div
              className="h-3 w-12 animate-pulse rounded"
              style={{ background: 'var(--surface-2)', opacity: 1 - i * 0.1 }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div
      className="rounded-lg py-16 text-center"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="mb-2 text-2xl" style={{ color: 'var(--text-dim)' }}>
        ○
      </div>
      <div className="text-sm" style={{ color: 'var(--text-dim)' }}>
        {message}
      </div>
    </div>
  )
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      className="mb-4 flex items-center justify-between rounded-lg px-4 py-3 text-sm"
      style={{ background: '#EF444415', border: '1px solid #EF444440', color: '#EF4444' }}
    >
      <span>{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded px-2 py-1 text-xs font-semibold hover:opacity-80"
          style={{ background: '#EF444420' }}
        >
          Retry
        </button>
      )}
    </div>
  )
}

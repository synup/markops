'use client'

import { useEffect, useState } from 'react'

interface ReclassifyToastProps {
  trackName: string
  onUndo: () => void
  onDismiss: () => void
}

export function ReclassifyToast({ trackName, onUndo, onDismiss }: ReclassifyToastProps) {
  const [seconds, setSeconds] = useState(10)

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          onDismiss()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [onDismiss])

  return (
    <div
      className="mb-3 flex items-center justify-between rounded-lg px-4 py-2.5"
      style={{ background: 'var(--surface-2)', border: '1px solid var(--brand-border)' }}
    >
      <span className="text-xs" style={{ color: 'var(--text)' }}>
        Post moved to {trackName}. <span style={{ color: 'var(--text-dim)' }}>({seconds}s)</span>
      </span>
      <button
        onClick={onUndo}
        className="rounded px-3 py-1 text-xs font-medium"
        style={{ background: 'var(--brand-muted)', color: 'var(--brand)' }}
      >
        Undo
      </button>
    </div>
  )
}

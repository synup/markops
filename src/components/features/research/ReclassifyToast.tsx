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
    <div className="mb-3 flex items-center justify-between rounded-lg border-[0.5px] border-cyan-200 bg-cyan-50 px-4 py-2.5">
      <span className="text-[13px] text-slate-700">
        Post moved to {trackName}. <span className="text-slate-500">({seconds}s)</span>
      </span>
      <button
        onClick={onUndo}
        className="rounded-md bg-cyan-500 px-3 py-1 text-[12px] font-medium text-white transition-colors duration-150 hover:bg-cyan-600"
      >
        Undo
      </button>
    </div>
  )
}

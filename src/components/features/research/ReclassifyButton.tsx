'use client'

import { useState } from 'react'

interface ReclassifyButtonProps {
  targetTrack: 'Content' | 'Tools'
  onConfirm: () => void
}

export function ReclassifyButton({ targetTrack, onConfirm }: ReclassifyButtonProps) {
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-slate-500">Move to {targetTrack}?</span>
        <button
          onClick={() => { onConfirm(); setConfirming(false) }}
          className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 transition-colors duration-150 hover:bg-emerald-100"
        >
          Confirm
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-md px-2 py-0.5 text-[11px] font-medium text-slate-500 transition-colors duration-150 hover:text-slate-700"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="rounded-md border-[0.5px] border-slate-300 px-2 py-1 text-[11px] font-medium text-slate-600 transition-colors duration-150 hover:border-cyan-500 hover:text-cyan-700"
      title={`Move this to ${targetTrack} Ideas`}
    >
      → {targetTrack}
    </button>
  )
}

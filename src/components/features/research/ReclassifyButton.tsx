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
      <div className="flex items-center gap-1">
        <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>
          Move to {targetTrack}?
        </span>
        <button
          onClick={() => { onConfirm(); setConfirming(false) }}
          className="btn-research rounded px-2 py-0.5 text-[10px] font-medium"
          style={{ background: 'var(--green-muted)', color: 'var(--green)' }}
        >
          Confirm
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="btn-research rounded px-2 py-0.5 text-[10px] font-medium"
          style={{ color: 'var(--text-dim)' }}
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="btn-research rounded px-2 py-1 text-[10px] font-medium"
      style={{ color: '#9CA3AF', border: '1px solid #4B5563' }}
      onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'var(--brand)' }}
      onMouseLeave={e => { e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.borderColor = '#4B5563' }}
      title={`Move this to ${targetTrack} Ideas`}
    >
      → {targetTrack}
    </button>
  )
}

'use client'

import { useEffect } from 'react'

const SHORTCUTS = [
  { keys: 'j',     label: 'Focus next conversation' },
  { keys: 'k',     label: 'Focus previous conversation' },
  { keys: 'Enter', label: 'Open detail drawer for focused row' },
  { keys: 'A',     label: 'Approve focused row (opens picker)' },
  { keys: 'R',     label: 'Reject focused row (opens reason input)' },
  { keys: 'Esc',   label: 'Close drawer / cancel picker / dismiss modal' },
  { keys: '?',     label: 'Show this help' },
]

type Props = { open: boolean; onClose: () => void }

export function ShortcutHelpModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 transition-opacity duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
    >
      <div
        className="w-full max-w-md rounded-xl border-[0.5px] border-slate-200 bg-white p-6 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[18px] font-medium text-slate-900">
            Keyboard shortcuts
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 transition-colors duration-150 hover:text-slate-600"
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path
                d="M3 3L11 11M11 3L3 11"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <dl className="space-y-2.5">
          {SHORTCUTS.map(s => (
            <div key={s.keys} className="flex items-center justify-between gap-4">
              <dd className="text-[14px] text-slate-700">{s.label}</dd>
              <dt>
                <kbd className="rounded border-[0.5px] border-slate-300 bg-slate-50 px-2 py-0.5 font-mono text-[12px] text-slate-700">
                  {s.keys}
                </kbd>
              </dt>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}

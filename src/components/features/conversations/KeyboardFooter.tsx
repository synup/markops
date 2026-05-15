type ShortcutHint = { keys: string; label: string }

const HINTS: ShortcutHint[] = [
  { keys: 'j / k', label: 'Navigate' },
  { keys: 'Enter', label: 'Open detail' },
  { keys: 'A',     label: 'Approve' },
  { keys: 'R',     label: 'Reject' },
  { keys: 'Esc',   label: 'Close / cancel' },
  { keys: '?',     label: 'Help' },
]

export function KeyboardFooter() {
  return (
    <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-200 pt-4 text-[12px] text-slate-500">
      {HINTS.map(h => (
        <span key={h.keys} className="inline-flex items-center gap-1.5">
          <kbd className="rounded border-[0.5px] border-slate-300 bg-white px-1.5 py-0.5 font-mono text-[11px] text-slate-700">
            {h.keys}
          </kbd>
          <span>{h.label}</span>
        </span>
      ))}
    </div>
  )
}

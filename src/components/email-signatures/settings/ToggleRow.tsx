interface ToggleRowProps {
  title: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
  last?: boolean
}

export function ToggleRow({ title, description, checked, onChange, last }: ToggleRowProps) {
  return (
    <div
      className="flex items-center justify-between px-5 py-4"
      style={last ? {} : { borderBottom: '1px solid var(--border)' }}
    >
      <div className="flex-1 min-w-0 mr-4">
        <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{title}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200"
        style={{ background: checked ? 'var(--brand)' : 'var(--surface-3)' }}
      >
        <span
          className="pointer-events-none inline-block h-5 w-5 rounded-full shadow-sm transition-transform duration-200"
          style={{
            background: '#fff',
            transform: checked ? 'translate(22px, 2px)' : 'translate(2px, 2px)',
          }}
        />
      </button>
    </div>
  )
}

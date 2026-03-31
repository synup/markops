interface UTMBuilderProps {
  form: { utm_source: string; utm_medium: string; utm_campaign: string; utm_content: string }
  onUpdate: (key: string, value: string) => void
}

const inputStyle: React.CSSProperties = {
  background: 'var(--surface-2)', color: 'var(--text)',
  border: '1px solid var(--border)',
}

export function UTMBuilder({ form, onUpdate }: UTMBuilderProps) {
  return (
    <div className="rounded-lg p-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
      <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>UTM Parameters</p>
      <div className="grid grid-cols-2 gap-2">
        {[
          { key: 'utm_source', label: 'Source' },
          { key: 'utm_medium', label: 'Medium' },
          { key: 'utm_campaign', label: 'Campaign' },
          { key: 'utm_content', label: 'Content' },
        ].map(f => (
          <div key={f.key}>
            <label className="block text-[10px] mb-0.5" style={{ color: 'var(--text-dim)' }}>{f.label}</label>
            <input
              value={form[f.key as keyof typeof form]}
              onChange={e => onUpdate(f.key, e.target.value)}
              className="w-full rounded px-2 py-1 text-xs outline-none"
              style={inputStyle}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

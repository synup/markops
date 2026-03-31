export default function EmailSignaturesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-6 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>
          Email Signatures
        </h2>
      </div>
      {children}
    </div>
  )
}

export function EmptyState({ icon, title, description, action }: {
  icon: string; title: string; description: string; action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-4xl mb-3">{icon}</span>
      <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{title}</h3>
      <p className="text-sm mt-1 max-w-sm" style={{ color: 'var(--text-muted)' }}>{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

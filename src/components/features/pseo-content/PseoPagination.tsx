interface PseoPaginationProps {
  page: number
  totalPages: number
  setPage: (page: number) => void
}

export function PseoPagination({ page, totalPages, setPage }: PseoPaginationProps) {
  if (totalPages <= 1) return null

  // Show at most 5 page numbers centered around current page
  const start = Math.max(1, page - 2)
  const end = Math.min(totalPages, start + 4)
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i)

  return (
    <div className="mt-4 flex items-center justify-center gap-1">
      <button
        onClick={() => setPage(page - 1)}
        disabled={page <= 1}
        className="rounded px-3 py-1.5 text-xs font-medium transition-colors"
        style={{
          background: 'var(--surface-2)',
          color: page <= 1 ? 'var(--text-dim)' : 'var(--text-muted)',
          cursor: page <= 1 ? 'not-allowed' : 'pointer',
        }}
      >
        Previous
      </button>
      {pages.map(p => (
        <button
          key={p}
          onClick={() => setPage(p)}
          className="rounded px-3 py-1.5 text-xs font-medium transition-colors"
          style={{
            background: p === page ? 'var(--brand)' : 'var(--surface-2)',
            color: p === page ? '#fff' : 'var(--text-muted)',
          }}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => setPage(page + 1)}
        disabled={page >= totalPages}
        className="rounded px-3 py-1.5 text-xs font-medium transition-colors"
        style={{
          background: 'var(--surface-2)',
          color: page >= totalPages ? 'var(--text-dim)' : 'var(--text-muted)',
          cursor: page >= totalPages ? 'not-allowed' : 'pointer',
        }}
      >
        Next
      </button>
    </div>
  )
}

'use client'

interface ExportCSVButtonProps {
  headers: string[]
  rows: string[][]
  filename: string
}

function escapeCSV(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`
  }
  return val
}

export function ExportCSVButton({ headers, rows, filename }: ExportCSVButtonProps) {
  const handleExport = () => {
    const lines = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(',')),
    ]
    const csv = lines.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      className="rounded px-2.5 py-1 text-[10px] font-semibold transition-opacity hover:opacity-80"
      style={{
        background: 'var(--surface-2)',
        color: 'var(--text-muted)',
        border: '1px solid var(--border)',
      }}
    >
      Export CSV
    </button>
  )
}

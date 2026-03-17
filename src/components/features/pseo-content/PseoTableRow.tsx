import type { PseoArticle } from '@/types'

interface PseoTableRowProps {
  article: PseoArticle
  expanded: boolean
}

function statusColor(code: number): string {
  if (code === 200) return 'var(--green)'
  if (code >= 400) return 'var(--red)'
  return 'var(--yellow)'
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export function PseoTableRow({ article, expanded }: PseoTableRowProps) {
  return (
    <tr className="pseo-row border-t" style={{ borderColor: 'var(--border)' }}>
      <td className="whitespace-nowrap px-3 py-2 text-xs" style={{ color: 'var(--text)' }}>
        {article.site}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-xs" style={{ color: 'var(--text-muted)' }}>
        {article.contentType}
      </td>
      <td className="max-w-[200px] truncate px-3 py-2 text-xs" style={{ color: 'var(--text)' }} title={article.title}>
        {article.title}
      </td>
      <td className="max-w-[120px] truncate px-3 py-2 text-xs" style={{ color: 'var(--text-muted)' }} title={article.slug}>
        {article.slug}
      </td>
      <td className="max-w-[160px] truncate px-3 py-2 text-xs">
        <a href={article.fullUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand)' }} className="hover:underline">
          {article.fullUrl}
        </a>
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-xs" style={{ color: 'var(--text)' }}>
        {article.targetKeyword}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-xs" style={{ color: 'var(--text-muted)' }}>
        {article.category}
      </td>
      <td className="max-w-[160px] truncate px-3 py-2 text-xs" style={{ color: 'var(--text-muted)' }} title={article.toolsList}>
        {article.toolsList}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-xs" style={{ color: 'var(--text-muted)' }}>
        {formatDate(article.publishedDate)}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-xs" style={{ color: 'var(--text)' }}>
        {article.indexerStatus}
      </td>
      {expanded && (
        <>
          <td className="px-3 py-2 text-center text-xs" style={{ color: 'var(--text)' }}>
            {article.toolCount}
          </td>
          <td className="whitespace-nowrap px-3 py-2 text-xs" style={{ color: statusColor(article.indexerResponseCode) }}>
            {article.indexerResponseCode || '—'}
          </td>
          <td className="whitespace-nowrap px-3 py-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            {formatDate(article.timestamp)}
          </td>
        </>
      )}
    </tr>
  )
}

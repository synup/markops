import type { RedditFeedSource } from '@/types'

interface FeedSourceRowProps {
  source: RedditFeedSource
  onToggle: (id: string, enabled: boolean) => void
  onRemove: (id: string) => void
}

export function FeedSourceRow({ source, onToggle, onRemove }: FeedSourceRowProps) {
  const displayName = source.feed_type === 'subreddit' ? `r/${source.value}` : source.value
  const polledAgo = source.last_polled_at
    ? timeAgo(new Date(source.last_polled_at))
    : 'never'

  return (
    <div
      className="flex items-center justify-between rounded-lg px-3 py-2.5"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        opacity: source.enabled ? 1 : 0.5,
      }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <button
          onClick={() => onToggle(source.id, !source.enabled)}
          className="btn-research flex h-4 w-4 shrink-0 items-center justify-center rounded text-[10px]"
          style={{
            background: source.enabled ? 'var(--green)' : 'var(--surface-3)',
            color: source.enabled ? '#fff' : 'var(--text-dim)',
          }}
        >
          {source.enabled ? '✓' : ''}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-xs font-medium" style={{ color: 'var(--text)' }}>
              {displayName}
            </span>
            {source.label && (
              <span className="truncate text-[10px]" style={{ color: 'var(--text-dim)' }}>
                {source.label}
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[10px]" style={{ color: 'var(--text-dim)' }}>
            <span>{source.feed_type === 'subreddit' ? 'subreddit' : 'keyword'}</span>
            <span>·</span>
            <span>{source.post_count} posts</span>
            <span>·</span>
            <span>polled {polledAgo}</span>
          </div>
        </div>
      </div>
      <button
        onClick={() => onRemove(source.id)}
        className="btn-research ml-2 shrink-0 text-xs"
        style={{ color: 'var(--text-dim)' }}
        title="Remove"
      >
        ✕
      </button>
    </div>
  )
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

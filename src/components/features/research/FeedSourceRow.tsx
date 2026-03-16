import type { RedditFeedSource } from '@/types'

interface FeedSourceRowProps {
  source: RedditFeedSource
  onToggle: (id: number, enabled: boolean) => void
  onRemove: (id: number) => void
}

export function FeedSourceRow({ source, onToggle, onRemove }: FeedSourceRowProps) {
  return (
    <div
      className="flex items-center justify-between rounded-lg px-3 py-2"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        opacity: source.enabled ? 1 : 0.5,
      }}
    >
      <div className="flex items-center gap-2">
        <button
          onClick={() => onToggle(source.id, !source.enabled)}
          className="flex h-4 w-4 items-center justify-center rounded text-[10px]"
          style={{
            background: source.enabled ? 'var(--green)' : 'var(--surface-3)',
            color: source.enabled ? '#fff' : 'var(--text-dim)',
          }}
        >
          {source.enabled ? '✓' : ''}
        </button>
        <span className="text-xs" style={{ color: 'var(--text)' }}>
          {source.type === 'subreddit' ? `r/${source.value}` : source.value}
        </span>
      </div>
      <button
        onClick={() => onRemove(source.id)}
        className="text-xs transition-colors"
        style={{ color: 'var(--text-dim)' }}
        title="Remove"
      >
        ✕
      </button>
    </div>
  )
}

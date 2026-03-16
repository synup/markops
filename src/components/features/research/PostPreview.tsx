import type { RedditPost } from '@/types'

interface PostPreviewProps {
  post: RedditPost
}

export function PostPreview({ post }: PostPreviewProps) {
  const preview = post.summary || post.selftext
  const truncated = preview ? (preview.length > 200 ? preview.slice(0, 200) + '...' : preview) : null

  return (
    <>
      {truncated && (
        <p className="mt-1.5 text-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>
          {truncated}
        </p>
      )}
      <div className="mt-1 text-[10px] truncate" style={{ color: 'var(--text-dim)' }}>
        {post.url}
      </div>
    </>
  )
}

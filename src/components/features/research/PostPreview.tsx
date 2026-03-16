'use client'

import { useState } from 'react'
import type { RedditPost } from '@/types'

interface PostPreviewProps {
  post: RedditPost
}

export function PostPreview({ post }: PostPreviewProps) {
  const [copied, setCopied] = useState(false)
  const preview = post.summary || post.selftext
  const truncated = preview ? (preview.length > 200 ? preview.slice(0, 200) + '...' : preview) : null

  const handleCopy = async () => {
    await navigator.clipboard.writeText(post.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <>
      {truncated && (
        <p className="mt-1.5 text-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>
          {truncated}
        </p>
      )}
      <div className="mt-1 flex items-center gap-1.5">
        <span className="truncate text-[10px]" style={{ color: 'var(--text-dim)' }}>
          {post.url}
        </span>
        <button
          onClick={handleCopy}
          className="relative shrink-0 rounded p-0.5 transition-colors hover:bg-[var(--surface-3)]"
          title="Copy URL"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--text-dim)' }}>
            <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11 5V3.5A1.5 1.5 0 009.5 2h-6A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          {copied && (
            <span
              className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded px-1.5 py-0.5 text-[9px] font-medium"
              style={{ background: 'var(--green)', color: '#fff' }}
            >
              Copied!
            </span>
          )}
        </button>
      </div>
    </>
  )
}

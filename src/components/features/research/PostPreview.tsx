'use client'

import { useState } from 'react'
import type { RedditPost } from '@/types'

interface PostPreviewProps {
  post: RedditPost
}

export function PostPreview({ post }: PostPreviewProps) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const rawText = post.summary || post.selftext
  const fullText = rawText ? rawText.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#039;/g, "'").trim() : null
  const isLong = fullText ? fullText.length > 200 : false
  const displayText = expanded ? fullText : (fullText ? (isLong ? fullText.slice(0, 200) + '...' : fullText) : null)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(post.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <>
      {displayText && (
        <div className="mt-1.5">
          <p className="whitespace-pre-line text-[14px] leading-[1.6] text-slate-700">
            {displayText}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-1 text-[12px] font-medium text-cyan-700 transition-colors duration-150 hover:text-cyan-800"
            >
              {expanded ? 'Show Less' : 'Read More'}
            </button>
          )}
        </div>
      )}
      <div className="mt-1 flex items-center gap-1.5">
        <span className="truncate text-[11px] text-slate-400">{post.url}</span>
        <button
          onClick={handleCopy}
          className="relative shrink-0 rounded p-0.5 transition-colors duration-150 hover:bg-slate-100"
          title="Copy URL"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-slate-400">
            <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11 5V3.5A1.5 1.5 0 009.5 2h-6A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          {copied && (
            <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-emerald-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
              Copied!
            </span>
          )}
        </button>
      </div>
    </>
  )
}

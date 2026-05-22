'use client'

import { useEffect, useState } from 'react'
import type { BriefPromptRow } from '@/hooks/useBriefPrompts'

const LABELS: Record<string, string> = {
  base: 'Base',
  blog_post: 'Blog post',
  deep_article: 'Deep article',
  use_case: 'Use case',
  collateral: 'Collateral',
  tool: 'Tool',
}

type Props = {
  prompts: BriefPromptRow[]
  selectedPromptName: string | null
  pendingChanges: Record<string, string>
  isSaving: boolean
  lastSavedAt: number | null
  error: string | null
  onChangeContent: (name: string, content: string) => void
  onSave: () => void
  onDiscard: () => void
}

export function BriefPromptEditor({
  prompts, selectedPromptName, pendingChanges,
  isSaving, lastSavedAt, error,
  onChangeContent, onSave, onDiscard,
}: Props) {
  const [showSaved, setShowSaved] = useState(false)
  const [savedAtTracked, setSavedAtTracked] = useState<number | null>(null)

  useEffect(() => {
    if (lastSavedAt && lastSavedAt !== savedAtTracked) {
      setSavedAtTracked(lastSavedAt)
      setShowSaved(true)
      const t = setTimeout(() => setShowSaved(false), 3000)
      return () => clearTimeout(t)
    }
  }, [lastSavedAt, savedAtTracked])

  if (!selectedPromptName) {
    return (
      <div className="rounded-xl border-[0.5px] border-slate-200 bg-white p-6">
        <p className="text-[14px] text-slate-500">Select a prompt to edit.</p>
      </div>
    )
  }

  const prompt = prompts.find(p => p.prompt_name === selectedPromptName)
  if (!prompt) return null

  const pending  = pendingChanges[selectedPromptName]
  const current  = pending !== undefined ? pending : prompt.prompt_content
  const hasChanges = pending !== undefined

  return (
    <div className="flex min-h-[600px] flex-col rounded-xl border-[0.5px] border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="text-[15px] font-medium text-slate-900">
          {LABELS[prompt.prompt_name] ?? prompt.prompt_name}
        </div>
        <div className="mt-0.5 text-[12px] text-slate-500">
          Last edited {new Date(prompt.updated_at).toLocaleString()}
          {prompt.updated_by ? ` by ${prompt.updated_by}` : ''} · {current.length} chars
        </div>
      </div>

      <textarea
        value={current}
        onChange={e => onChangeContent(selectedPromptName, e.target.value)}
        className="min-h-[500px] flex-1 resize-y border-0 bg-white px-5 py-4 font-mono text-[12px] leading-relaxed text-slate-900 focus:outline-none"
        spellCheck={false}
        aria-label={`Prompt content for ${prompt.prompt_name}`}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-3">
        <div className="flex flex-wrap items-center gap-3 text-[13px]">
          {hasChanges && (
            <span className="inline-flex items-center gap-1.5 text-amber-700">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
              Unsaved changes
            </span>
          )}
          {showSaved && !hasChanges && savedAtTracked && (
            <span className="inline-flex items-center gap-1.5 text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
              Saved {new Date(savedAtTracked).toLocaleTimeString()}
            </span>
          )}
          {error && (
            <span className="text-rose-700">Error: {error}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <button
              type="button"
              onClick={onDiscard}
              disabled={isSaving}
              className="rounded-md px-3 py-1.5 text-[13px] text-slate-500 transition-colors hover:text-slate-700 disabled:opacity-50"
            >
              Discard
            </button>
          )}
          <button
            type="button"
            onClick={onSave}
            disabled={!hasChanges || isSaving}
            className={[
              'rounded-md px-4 py-1.5 text-[13px] font-medium transition-colors',
              hasChanges && !isSaving
                ? 'bg-cyan-500 text-white hover:bg-cyan-600'
                : 'cursor-not-allowed bg-slate-200 text-slate-400',
            ].join(' ')}
          >
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

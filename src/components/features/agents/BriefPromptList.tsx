'use client'

import type { BriefPromptRow } from '@/hooks/useBriefPrompts'

const LABELS: Record<string, string> = {
  base: 'Base',
  blog_post: 'Blog post',
  deep_article: 'Deep article',
  use_case: 'Use case',
  collateral: 'Collateral',
  tool: 'Tool',
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  if (Number.isNaN(ms) || ms < 0) return ''
  const min = Math.floor(ms / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min} min ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} hr ago`
  const day = Math.floor(hr / 24)
  if (day === 1) return 'yesterday'
  if (day < 30) return `${day} days ago`
  const mo = Math.floor(day / 30)
  return `${mo} mo ago`
}

type Props = {
  prompts: BriefPromptRow[]
  selectedPromptName: string | null
  pendingChanges: Record<string, string>
  onSelect: (name: string) => void
}

export function BriefPromptList({
  prompts, selectedPromptName, pendingChanges, onSelect,
}: Props) {
  return (
    <ul className="overflow-hidden rounded-xl border-[0.5px] border-slate-200 bg-white">
      {prompts.map((p, i) => {
        const isSelected = p.prompt_name === selectedPromptName
        const hasPending = p.prompt_name in pendingChanges
        return (
          <li
            key={p.id}
            className={i > 0 ? 'border-t border-slate-200' : ''}
          >
            <button
              type="button"
              onClick={() => onSelect(p.prompt_name)}
              className={[
                'block w-full border-l-2 px-4 py-3 text-left transition-colors',
                isSelected
                  ? 'border-cyan-500 bg-slate-100'
                  : 'border-transparent hover:bg-slate-50',
              ].join(' ')}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[14px] font-medium text-slate-900">
                  {LABELS[p.prompt_name] ?? p.prompt_name}
                </span>
                {hasPending && (
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"
                    aria-label="unsaved changes"
                  />
                )}
              </div>
              <div className="mt-0.5 truncate text-[12px] text-slate-500">
                {p.updated_at
                  ? `Edited ${timeAgo(p.updated_at)}${p.updated_by ? ` by ${p.updated_by}` : ''}`
                  : 'Never edited'}
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

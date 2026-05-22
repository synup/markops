'use client'

import { useEffect, useState } from 'react'

export const ASSET_TYPES = [
  { value: 'blog_post',          label: 'Blog post' },
  { value: 'deep_article',       label: 'Deep article' },
  { value: 'use_case',           label: 'Use case' },
  { value: 'collateral',         label: 'Collateral' },
  { value: 'tool',               label: 'Tool' },
  { value: 'thought_leadership', label: 'Thought leadership' },
] as const

export type AssetType = (typeof ASSET_TYPES)[number]['value']

export const AUTHOR_VOICES = [
  { value: 'sudy',    label: 'Sudy' },
  { value: 'roshan',  label: 'Roshan' },
  { value: 'niladri', label: 'Niladri' },
] as const

export type AuthorVoice = (typeof AUTHOR_VOICES)[number]['value']

const DEFAULT_VOICE: AuthorVoice = 'niladri'
const isValidVoice = (v: string | null | undefined): v is AuthorVoice =>
  v != null && AUTHOR_VOICES.some(av => av.value === v)

type Props = {
  suggested: AssetType | null
  suggestedAuthor: string | null
  onConfirm: (assetType: AssetType, authorVoice?: AuthorVoice) => void
  onCancel: () => void
}

export function ApprovalPicker({ suggested, suggestedAuthor, onConfirm, onCancel }: Props) {
  const [selected, setSelected] = useState<AssetType>(suggested ?? 'blog_post')
  const [voice, setVoice] = useState<AuthorVoice>(
    isValidVoice(suggestedAuthor) ? suggestedAuthor : DEFAULT_VOICE,
  )

  const isThoughtLeadership = selected === 'thought_leadership'

  // Reset voice to the suggested-author default whenever the asset type
  // moves away from thought_leadership — so re-selecting it starts clean
  // from the insight's suggested_author rather than a stale prior pick.
  useEffect(() => {
    if (!isThoughtLeadership) {
      setVoice(isValidVoice(suggestedAuthor) ? suggestedAuthor : DEFAULT_VOICE)
    }
  }, [isThoughtLeadership, suggestedAuthor])

  const handleConfirm = () =>
    onConfirm(selected, isThoughtLeadership ? voice : undefined)

  return (
    <div className="mt-4 rounded-lg border-[0.5px] border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 text-[13px] text-slate-500">
        Approve as which asset type?
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {ASSET_TYPES.map(at => {
          const isSel = selected === at.value
          return (
            <button
              key={at.value}
              type="button"
              onClick={() => setSelected(at.value)}
              className={`rounded-full border-[0.5px] px-3 py-1 text-[12px] transition-colors duration-150 ${
                isSel
                  ? 'border-cyan-500 bg-cyan-500 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              {at.label}
            </button>
          )
        })}
      </div>
      {isThoughtLeadership && (
        <div className="mb-4 ml-4 border-l-[0.5px] border-slate-200 pl-4">
          <div className="mb-2 text-[12px] text-slate-500">Author voice</div>
          <div className="flex flex-wrap gap-2">
            {AUTHOR_VOICES.map(av => {
              const isSel = voice === av.value
              return (
                <button
                  key={av.value}
                  type="button"
                  onClick={() => setVoice(av.value)}
                  className={`rounded-full border-[0.5px] px-3 py-1 text-[12px] transition-colors duration-150 ${
                    isSel
                      ? 'border-cyan-500 bg-cyan-500 text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {av.label}
                </button>
              )
            })}
          </div>
        </div>
      )}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border-[0.5px] border-slate-300 bg-white px-3 py-1.5 text-[13px] text-slate-700 transition-colors duration-150 hover:bg-slate-100"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="rounded-md bg-cyan-500 px-3 py-1.5 text-[13px] text-white transition-colors duration-150 hover:bg-cyan-600"
        >
          Confirm
        </button>
      </div>
    </div>
  )
}

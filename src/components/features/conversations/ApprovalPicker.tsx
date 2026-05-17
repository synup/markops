'use client'

import { useState } from 'react'

export const ASSET_TYPES = [
  { value: 'blog_post',          label: 'Blog post' },
  { value: 'deep_article',       label: 'Deep article' },
  { value: 'use_case',           label: 'Use case' },
  { value: 'collateral',         label: 'Collateral' },
  { value: 'tool',               label: 'Tool' },
  { value: 'thought_leadership', label: 'Thought leadership' },
] as const

export type AssetType = (typeof ASSET_TYPES)[number]['value']

type Props = {
  suggested: AssetType | null
  onConfirm: (assetType: AssetType) => void
  onCancel: () => void
}

export function ApprovalPicker({ suggested, onConfirm, onCancel }: Props) {
  const [selected, setSelected] = useState<AssetType>(suggested ?? 'blog_post')

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
          onClick={() => onConfirm(selected)}
          className="rounded-md bg-cyan-500 px-3 py-1.5 text-[13px] text-white transition-colors duration-150 hover:bg-cyan-600"
        >
          Confirm
        </button>
      </div>
    </div>
  )
}

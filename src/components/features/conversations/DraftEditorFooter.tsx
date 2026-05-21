'use client'

type Props = {
  pending: string
  hasChanges: boolean
  canSave: boolean
  isSaving: boolean
  onCopy: () => void
  onDiscard: () => void
  onSave: () => void
}

const SAVE_ACTIVE =
  'rounded-md bg-cyan-500 px-4 py-1.5 font-medium text-white transition-colors hover:bg-cyan-600'
const SAVE_DISABLED =
  'cursor-not-allowed rounded-md bg-slate-200 px-4 py-1.5 font-medium text-slate-400'

export function DraftEditorFooter({
  pending, hasChanges, canSave, isSaving, onCopy, onDiscard, onSave,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-6 py-3">
      <button
        type="button"
        onClick={onCopy}
        disabled={pending.length === 0}
        className="rounded-md bg-slate-100 px-3 py-1.5 text-[13px] text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-50"
      >
        Copy to clipboard
      </button>
      <div className="flex flex-wrap items-center gap-2 text-[13px]">
        {hasChanges && (
          <span className="inline-flex items-center gap-1.5 text-amber-700">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
            Unsaved changes
          </span>
        )}
        {hasChanges && (
          <button
            type="button"
            onClick={onDiscard}
            disabled={isSaving}
            className="rounded-md px-3 py-1.5 text-slate-500 transition-colors hover:text-slate-700 disabled:opacity-50"
          >
            Discard
          </button>
        )}
        <button
          type="button"
          onClick={onSave}
          disabled={!canSave || isSaving}
          className={canSave && !isSaving ? SAVE_ACTIVE : SAVE_DISABLED}
        >
          {isSaving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}

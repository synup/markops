import { ASSET_TYPES } from './ApprovalPicker'

type Props = {
  assetType: string | null
  onUndo: () => void
  onDismiss: () => void
}

export function JustApprovedBanner({ assetType, onUndo, onDismiss }: Props) {
  const label = assetType
    ? ASSET_TYPES.find(a => a.value === assetType)?.label ?? assetType
    : null
  return (
    <div className="mb-4 flex items-center gap-3 rounded-lg border-[0.5px] border-emerald-200 bg-emerald-50 px-4 py-3">
      <div className="flex-1 text-[14px] text-emerald-800">
        Approved
        {label ? (
          <>
            {' '}as <span className="font-medium">{label}</span>
          </>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onUndo}
        className="rounded-md border-[0.5px] border-emerald-300 bg-white px-3 py-1 text-[13px] text-emerald-800 transition-colors duration-150 hover:bg-emerald-100"
      >
        Undo
      </button>
      <button
        type="button"
        onClick={onDismiss}
        className="text-emerald-700 transition-colors duration-150 hover:text-emerald-900"
        aria-label="Dismiss"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path
            d="M3 3L11 11M11 3L3 11"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  )
}

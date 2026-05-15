'use client'

import { useState } from 'react'

const MAX_REASON_LEN = 1000

type Props = {
  onConfirm: (reason: string | null) => void
  onCancel: () => void
}

export function RejectInput({ onConfirm, onCancel }: Props) {
  const [reason, setReason] = useState('')

  const handleConfirm = () => {
    const trimmed = reason.trim()
    onConfirm(trimmed === '' ? null : trimmed)
  }

  return (
    <div className="mt-4 rounded-lg border-[0.5px] border-slate-200 bg-slate-50 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[13px] text-slate-500">
          Reason for rejection (optional)
        </span>
        <span className="text-[11px] text-slate-400">
          {reason.length}/{MAX_REASON_LEN}
        </span>
      </div>
      <textarea
        value={reason}
        onChange={e => setReason(e.target.value.slice(0, MAX_REASON_LEN))}
        placeholder="Why is this not a good fit for content?"
        rows={3}
        className="mb-4 w-full resize-none rounded-md border-[0.5px] border-slate-300 bg-white px-3 py-2 text-[14px] text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none"
      />
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
          Confirm reject
        </button>
      </div>
    </div>
  )
}

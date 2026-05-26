'use client'

import { useState } from 'react'
import type { ToolApprovalDetails } from '@/hooks/useResearchToolActions'

const MAX_NOTES_LEN = 1000

type Props = {
  onConfirm: (details: ToolApprovalDetails) => void
  onCancel: () => void
}

export function ToolApprovalForm({ onConfirm, onCancel }: Props) {
  const [assignedTo, setAssignedTo] = useState('')
  const [notes, setNotes] = useState('')

  const handleConfirm = () => {
    onConfirm({
      assigned_to: assignedTo.trim() === '' ? null : assignedTo.trim(),
      notes: notes.trim() === '' ? null : notes.trim(),
    })
  }

  return (
    <div className="mt-4 rounded-lg border-[0.5px] border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 text-[13px] text-slate-500">Approve this tool idea</div>

      <label className="mb-1 block text-[12px] text-slate-500">Assign to (optional)</label>
      <input
        type="text"
        value={assignedTo}
        onChange={e => setAssignedTo(e.target.value)}
        placeholder="email or name"
        className="mb-3 w-full rounded-md border-[0.5px] border-slate-300 bg-white px-3 py-2 text-[14px] text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none"
      />

      <div className="mb-2 flex items-center justify-between">
        <span className="mb-1 block text-[12px] text-slate-500">Notes (optional)</span>
        <span className="text-[11px] text-slate-400">{notes.length}/{MAX_NOTES_LEN}</span>
      </div>
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value.slice(0, MAX_NOTES_LEN))}
        placeholder="What's the build look like? Any constraints?"
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
          Confirm approve
        </button>
      </div>
    </div>
  )
}

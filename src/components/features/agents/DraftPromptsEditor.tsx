'use client'

import { useDraftPrompts } from '@/hooks/useDraftPrompts'
import { DraftPromptList } from './DraftPromptList'
import { DraftPromptEditor } from './DraftPromptEditor'

export function DraftPromptsEditor() {
  const state = useDraftPrompts()

  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="text-[14px] text-slate-500">Loading prompts…</div>
      </div>
    )
  }

  if (state.error && state.prompts.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="rounded-md border-[0.5px] border-red-200 bg-red-50 p-4 text-[14px] text-red-700">
          Failed to load draft prompts: {state.error}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <header className="mb-6">
          <h1 className="text-[22px] font-medium text-slate-900">Draft prompts</h1>
          <p className="mt-1 text-[13px] text-slate-500">
            Edit the prompts the draft-generator worker uses to turn approved
            thought_leadership conversations into short-form social posts.
            Changes apply on the next cron run (every 2 min).
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,2.3fr)]">
          <DraftPromptList
            prompts={state.prompts}
            selectedPromptName={state.selectedPromptName}
            pendingChanges={state.pendingChanges}
            onSelect={state.selectPrompt}
          />
          <DraftPromptEditor
            prompts={state.prompts}
            selectedPromptName={state.selectedPromptName}
            pendingChanges={state.pendingChanges}
            isSaving={state.isSaving}
            lastSavedAt={state.lastSavedAt}
            error={state.error}
            onChangeContent={state.setPendingContent}
            onSave={state.saveSelected}
            onDiscard={state.discardSelected}
          />
        </div>
      </div>
    </div>
  )
}

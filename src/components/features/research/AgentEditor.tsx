'use client'

import { useState } from 'react'
import type { RedditAgentConfig } from '@/types'

interface AgentEditorProps {
  agent: RedditAgentConfig
  onSave: (id: string, prompt: string) => Promise<boolean>
  onClose: () => void
}

export function AgentEditor({ agent, onSave, onClose }: AgentEditorProps) {
  const [prompt, setPrompt] = useState(agent.system_prompt)
  const [saving, setSaving] = useState(false)
  const hasChanges = prompt !== agent.system_prompt

  const handleSave = async () => {
    setSaving(true)
    const ok = await onSave(agent.id, prompt)
    setSaving(false)
    if (ok) onClose()
  }

  return (
    <div
      className="rounded-lg p-4"
      style={{ background: 'var(--surface)', border: '1px solid var(--brand-border)' }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
            {agent.agent_name}
          </span>
          <span className="ml-2 text-xs" style={{ color: 'var(--text-dim)' }}>
            v{agent.version} → v{agent.version + 1}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-xs"
          style={{ color: 'var(--text-dim)' }}
        >
          ✕ Close
        </button>
      </div>

      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        rows={16}
        className="mb-3 w-full resize-y rounded-lg p-3 text-xs leading-relaxed"
        style={{
          background: 'var(--surface-2)',
          color: 'var(--text)',
          border: '1px solid var(--border)',
        }}
      />

      <div className="flex items-center justify-between">
        <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>
          {prompt.length} chars
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="rounded px-3 py-1.5 text-xs font-medium"
            style={{ color: 'var(--text-muted)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="rounded px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
            style={{ background: 'var(--brand)' }}
          >
            {saving ? 'Saving...' : 'Save & Increment Version'}
          </button>
        </div>
      </div>
    </div>
  )
}

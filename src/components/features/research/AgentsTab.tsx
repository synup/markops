'use client'

import { useState } from 'react'
import { useAgentConfigs } from '@/hooks/useRedditResearch'
import { AgentCard } from './AgentCard'
import { AgentEditor } from './AgentEditor'
import type { RedditAgentConfig } from '@/types'

export function AgentsTab() {
  const { agents, loading, updatePrompt, toggleAgent } = useAgentConfigs()
  const [editing, setEditing] = useState<RedditAgentConfig | null>(null)

  if (loading) {
    return <div className="py-8 text-center text-sm" style={{ color: 'var(--text-dim)' }}>Loading agents...</div>
  }

  if (!agents.length) {
    return <div className="py-8 text-center text-sm" style={{ color: 'var(--text-dim)' }}>No agent configs found.</div>
  }

  if (editing) {
    return (
      <AgentEditor
        agent={editing}
        onSave={updatePrompt}
        onClose={() => setEditing(null)}
      />
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="mb-1 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
        {agents.length} agents configured
      </div>
      {agents.map(agent => (
        <AgentCard
          key={agent.id}
          agent={agent}
          onToggle={toggleAgent}
          onEdit={setEditing}
        />
      ))}
    </div>
  )
}

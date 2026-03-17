import type { RedditAgentConfig } from '@/types'
import { FeedbackSummary } from './FeedbackSummary'
import { PromptSuggestions } from './PromptSuggestions'

interface AgentCardProps {
  agent: RedditAgentConfig
  onToggle: (id: string, enabled: boolean) => void
  onEdit: (agent: RedditAgentConfig) => void
}

export function AgentCard({ agent, onToggle, onEdit }: AgentCardProps) {
  const updatedAgo = agent.updated_at
    ? timeAgo(new Date(agent.updated_at))
    : 'never'

  return (
    <div
      className="rounded-lg p-4"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        opacity: agent.enabled ? 1 : 0.5,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
              {agent.agent_name}
            </span>
            <span
              className="rounded px-1.5 py-0.5 text-[10px] font-medium"
              style={{ background: 'var(--brand-muted)', color: 'var(--brand)' }}
            >
              {agent.agent_role}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-[10px]" style={{ color: 'var(--text-dim)' }}>
            <span>{agent.model}</span>
            <span>·</span>
            <span>v{agent.version}</span>
            <span>·</span>
            <span>updated {updatedAgo}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggle(agent.id, !agent.enabled)}
            className="flex h-5 w-5 items-center justify-center rounded text-[10px]"
            style={{
              background: agent.enabled ? 'var(--green)' : 'var(--surface-3)',
              color: agent.enabled ? '#fff' : 'var(--text-dim)',
            }}
          >
            {agent.enabled ? '✓' : ''}
          </button>
          <button
            onClick={() => onEdit(agent)}
            className="rounded px-2.5 py-1 text-xs font-medium transition-colors"
            style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
          >
            Edit Prompt
          </button>
        </div>
      </div>
      <div
        className="mt-2 max-h-[60px] overflow-hidden text-xs"
        style={{ color: 'var(--text-dim)' }}
      >
        {agent.system_prompt.slice(0, 200)}{agent.system_prompt.length > 200 ? '...' : ''}
      </div>
      <FeedbackSummary agentName={agent.agent_name} />
      <PromptSuggestions agentName={agent.agent_name} />
    </div>
  )
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

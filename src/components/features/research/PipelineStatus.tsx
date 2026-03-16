const TOOL_PIPELINE = [
  { name: 'Reddit Scanner', role: 'CEO', color: 'var(--orange)' },
  { name: 'Tool Scorer', role: 'Analyst', color: 'var(--yellow)' },
  { name: 'Tool Builder', role: 'Engineer', color: 'var(--green)' },
  { name: 'Tool Promoter', role: 'Marketer', color: 'var(--blue)' },
]

const CONTENT_PIPELINE = [
  { name: 'Reddit Scanner', role: 'CEO', color: 'var(--orange)' },
  { name: 'Content Validator', role: 'Analyst', color: 'var(--yellow)' },
  { name: 'Brief Builder', role: 'Writer', color: 'var(--brand)' },
]

export function PipelineStatus() {
  return (
    <div
      className="rounded-lg p-4"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="mb-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
        6-Agent Pipeline
      </div>

      <div className="mb-3">
        <div className="mb-1.5 text-[10px] font-medium" style={{ color: 'var(--text-dim)' }}>
          TOOL TRACK
        </div>
        <PipelineRow agents={TOOL_PIPELINE} />
      </div>

      <div>
        <div className="mb-1.5 text-[10px] font-medium" style={{ color: 'var(--text-dim)' }}>
          CONTENT TRACK
        </div>
        <PipelineRow agents={CONTENT_PIPELINE} />
      </div>
    </div>
  )
}

function PipelineRow({ agents }: { agents: typeof TOOL_PIPELINE }) {
  return (
    <div className="flex items-center gap-1">
      {agents.map((agent, i) => (
        <div key={agent.name + agent.role} className="flex items-center gap-1">
          <div
            className="rounded px-2 py-1"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
          >
            <div className="text-[10px] font-medium" style={{ color: agent.color }}>
              {agent.name}
            </div>
            <div className="text-[9px]" style={{ color: 'var(--text-dim)' }}>
              {agent.role}
            </div>
          </div>
          {i < agents.length - 1 && (
            <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>→</span>
          )}
        </div>
      ))}
    </div>
  )
}

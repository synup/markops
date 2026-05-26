import type { DrawerTarget } from '@/hooks/useResearchDrawer'
import { ResearchScoreBar } from './ResearchScoreBar'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-[14px] font-medium text-slate-700">{title}</h3>
      {children}
    </section>
  )
}

type Props = {
  target: DrawerTarget
}

export function DrawerScoreBreakdown({ target }: Props) {
  if (target.kind === 'tool') {
    const idea = target.idea
    return (
      <Section title="Score breakdown">
        <div className="space-y-2">
          <ResearchScoreBar label="Relevance" value={idea.relevance_score} max={10} />
          <ResearchScoreBar label="Intent" value={idea.intent_score} max={10} />
          <ResearchScoreBar label="Engagement" value={idea.engagement_score} max={10} />
          <ResearchScoreBar label="Recency" value={idea.recency_score} max={10} />
          <ResearchScoreBar label="Competitive gap" value={idea.competitive_gap_score} max={10} />
        </div>
      </Section>
    )
  }

  const idea = target.idea
  return (
    <Section title="Score breakdown">
      <div className="space-y-2">
        <ResearchScoreBar label="Relevance" value={idea.relevance_score} max={10} />
        <ResearchScoreBar label="Search demand" value={idea.search_demand_score} max={10} />
        <ResearchScoreBar label="Engagement" value={idea.engagement_score} max={10} />
        <ResearchScoreBar label="Recency" value={idea.recency_score} max={10} />
        <ResearchScoreBar label="Competitive gap" value={idea.competitive_gap_score} max={10} />
      </div>
    </Section>
  )
}

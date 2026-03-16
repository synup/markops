'use client'

import { ResearchActivityLog } from './ResearchActivityLog'
import { FeedSourceManager } from './FeedSourceManager'
import { SubredditSuggestionsList } from './SubredditSuggestionsList'
import { PipelineStatus } from './PipelineStatus'

export function FeedTab() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <FeedSourceManager />
      </div>
      <div className="flex flex-col gap-6">
        <PipelineStatus />
        <SubredditSuggestionsList />
        <ResearchActivityLog />
      </div>
    </div>
  )
}

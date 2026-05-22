'use client'

import type { Counts, ConversationRow, SuggestedAssetType } from '@/types/conversation'
import type { useUrlState } from '@/hooks/useUrlState'
import type { LastApproved } from '@/hooks/useConversationActions'
import { ConversationsTabBar } from './ConversationsTabBar'
import { ConversationsFilters } from './ConversationsFilters'
import { type AuthorVoice } from './ApprovalPicker'
import { InsightCard, type CardMode } from './InsightCard'
import { DetailDrawer } from './DetailDrawer'
import { JustApprovedBanner } from './JustApprovedBanner'
import { KeyboardFooter } from './KeyboardFooter'
import { ShortcutHelpModal } from './ShortcutHelpModal'

type UrlReturn = ReturnType<typeof useUrlState>

type Props = {
  url: UrlReturn
  rows: ConversationRow[]
  counts: Counts
  loading: boolean
  error: string | null
  focusedIndex: number
  onFocusCard: (i: number) => void
  expandedCardId: string | null
  cardMode: CardMode
  onCardModeChange: (id: string, mode: CardMode) => void
  exitingIds: Set<string>
  onOpenDrawer: (id: string) => void
  onApprove: (id: string, assetType: SuggestedAssetType, authorVoice?: AuthorVoice) => void
  onReject: (id: string, reason: string | null) => void
  onRevoke: (id: string) => void
  drawerRow: ConversationRow | null
  onCloseDrawer: () => void
  lastApproved: LastApproved | null
  onUndoApprove: () => void
  onDismissApproved: () => void
  helpOpen: boolean
  onHelpToggle: () => void
}

export function ConversationsView(p: Props) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <header className="mb-6">
          <h1 className="text-[22px] font-medium text-slate-900">Conversations</h1>
          <p className="mt-1 text-[13px] text-slate-500">
            Review sales and customer success conversations and approve them for content.
          </p>
        </header>

        <div className="mb-4">
          <ConversationsTabBar
            activeTab={p.url.tab}
            onTabChange={p.url.setTab}
            counts={p.counts}
          />
        </div>

        <ConversationsFilters url={p.url} />

        {p.url.tab === 'approved' && p.lastApproved && (
          <JustApprovedBanner
            assetType={p.lastApproved.assetType}
            onUndo={p.onUndoApprove}
            onDismiss={p.onDismissApproved}
          />
        )}

        {p.loading ? (
          <div className="py-12 text-center text-[14px] text-slate-500">Loading…</div>
        ) : p.error ? (
          <div className="rounded-lg border-[0.5px] border-red-200 bg-red-50 p-4 text-[14px] text-red-700">
            Failed to load: {p.error}
          </div>
        ) : p.rows.length === 0 ? (
          <div className="py-12 text-center text-[14px] text-slate-500">
            No conversations in this view.
          </div>
        ) : (
          <ul className="space-y-3">
            {p.rows.map((row, i) => (
              <li key={row.id} onMouseEnter={() => p.onFocusCard(i)}>
                <InsightCard
                  row={row}
                  focused={i === p.focusedIndex}
                  exiting={p.exitingIds.has(row.id)}
                  mode={p.expandedCardId === row.id ? p.cardMode : 'collapsed'}
                  isApprovedTab={p.url.tab === 'approved'}
                  onModeChange={m => p.onCardModeChange(row.id, m)}
                  onOpenDrawer={p.onOpenDrawer}
                  onApprove={(at, voice) => p.onApprove(row.id, at, voice)}
                  onReject={r => p.onReject(row.id, r)}
                  onRevoke={() => p.onRevoke(row.id)}
                />
              </li>
            ))}
          </ul>
        )}

        <KeyboardFooter />
      </div>

      <DetailDrawer
        row={p.drawerRow}
        onClose={p.onCloseDrawer}
        onApprove={(at, voice) => { if (p.drawerRow) p.onApprove(p.drawerRow.id, at, voice) }}
        onReject={r => { if (p.drawerRow) p.onReject(p.drawerRow.id, r) }}
        onRevoke={() => { if (p.drawerRow) p.onRevoke(p.drawerRow.id) }}
      />

      <ShortcutHelpModal open={p.helpOpen} onClose={p.onHelpToggle} />
    </div>
  )
}

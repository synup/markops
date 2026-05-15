'use client'

import { useEffect, useState } from 'react'
import { useUrlState } from '@/hooks/useUrlState'
import { useConversations } from '@/hooks/useConversations'
import { useDetailDrawer } from '@/hooks/useDetailDrawer'
import { useConversationActions } from '@/hooks/useConversationActions'
import { useKeyboardNav } from '@/hooks/useKeyboardNav'
import { type CardMode } from './InsightCard'
import { ConversationsView } from './ConversationsView'

export function ConversationsContainer() {
  const url     = useUrlState()
  const conv    = useConversations(url)
  const drawer  = useDetailDrawer(conv.rows)
  const actions = useConversationActions({
    rows:       conv.rows,
    removeRow:  conv.removeRow,
    bumpCount:  conv.bumpCount,
  })

  const [focusedIndex,   setFocusedIndex]   = useState(0)
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null)
  const [cardMode,       setCardMode]       = useState<CardMode>('collapsed')
  const [helpOpen,       setHelpOpen]       = useState(false)

  // Reset focus when the active filter set changes.
  useEffect(() => {
    setFocusedIndex(0)
  }, [url.tab, url.conversationType, url.bracket, url.sort])

  // Clamp focus when row count shrinks (post-mutation).
  useEffect(() => {
    if (focusedIndex >= conv.rows.length && conv.rows.length > 0) {
      setFocusedIndex(conv.rows.length - 1)
    }
  }, [conv.rows.length, focusedIndex])

  // Clear the JustApprovedBanner when leaving the Approved tab.
  useEffect(() => {
    if (url.tab !== 'approved') actions.dismissApproved()
  }, [url.tab, actions])

  const closeExpansion = () => {
    setExpandedCardId(null)
    setCardMode('collapsed')
  }

  const handleCardModeChange = (id: string, mode: CardMode) => {
    if (mode === 'collapsed') closeExpansion()
    else {
      setExpandedCardId(id)
      setCardMode(mode)
    }
  }

  const focusedRow = conv.rows[focusedIndex] ?? null

  useKeyboardNav({
    rowCount: conv.rows.length,
    focusedIndex,
    setFocusedIndex,
    isDisabled: drawer.openRow != null || helpOpen || expandedCardId != null,
    onEnter:    () => focusedRow && drawer.open(focusedRow.id),
    onApprove:  () => {
      if (!focusedRow || focusedRow.review_status !== 'pending') return
      setExpandedCardId(focusedRow.id)
      setCardMode('approve')
    },
    onReject:   () => {
      if (!focusedRow || focusedRow.review_status !== 'pending') return
      setExpandedCardId(focusedRow.id)
      setCardMode('reject')
    },
    onEscape:   () => {
      if (drawer.openRow)      drawer.close()
      else if (helpOpen)       setHelpOpen(false)
      else if (expandedCardId) closeExpansion()
    },
    onHelpToggle: () => setHelpOpen(o => !o),
  })

  return (
    <ConversationsView
      url={url}
      rows={conv.rows}
      counts={conv.counts}
      loading={conv.loading}
      error={conv.error}
      focusedIndex={focusedIndex}
      onFocusCard={setFocusedIndex}
      expandedCardId={expandedCardId}
      cardMode={cardMode}
      onCardModeChange={handleCardModeChange}
      exitingIds={actions.exitingIds}
      onOpenDrawer={drawer.open}
      onApprove={actions.handleApprove}
      onReject={actions.handleReject}
      onRevoke={actions.handleRevoke}
      drawerRow={drawer.openRow}
      onCloseDrawer={drawer.close}
      lastApproved={actions.lastApproved}
      onUndoApprove={actions.undoApprove}
      onDismissApproved={actions.dismissApproved}
      helpOpen={helpOpen}
      onHelpToggle={() => setHelpOpen(o => !o)}
    />
  )
}

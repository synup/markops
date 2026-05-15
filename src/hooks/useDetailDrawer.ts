'use client'

import { useCallback, useState } from 'react'
import type { ConversationRow } from '@/types/conversation'

export function useDetailDrawer(rows: ConversationRow[]) {
  const [openId, setOpenId] = useState<string | null>(null)

  const open = useCallback((id: string) => setOpenId(id), [])
  const close = useCallback(() => setOpenId(null), [])

  // Drawer's "open" state is derived from whether the row is still in the list.
  // When a row is optimistically removed (approve/reject), this naturally
  // resolves to null and the drawer closes.
  const openRow = openId ? rows.find(r => r.id === openId) ?? null : null

  return { openRow, open, close, openId }
}

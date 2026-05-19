'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import type { ReviewStatus, ConversationType } from '@/types/conversation'

export type Bracket = 'high' | 'medium' | 'low'
export type Sort = 'score' | 'recent'

const VALID_TABS: readonly ReviewStatus[] = ['pending', 'approved', 'rejected']
const VALID_CONV_TYPES: readonly ConversationType[] = ['sales', 'cs', 'unknown']
const VALID_BRACKETS: readonly Bracket[] = ['high', 'medium', 'low']
const VALID_SORTS: readonly Sort[] = ['score', 'recent']

export type UrlState = {
  tab: ReviewStatus
  conversationType: ConversationType | null
  bracket: Bracket | null
  sort: Sort | null
}

function parse<T extends string>(value: string | null, allowed: readonly T[]): T | null {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : null
}

type UrlPatch = Partial<{
  tab: string | null
  conversation_type: string | null
  bracket: string | null
  sort: string | null
}>

export function useUrlState() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const state: UrlState = {
    tab:              parse(searchParams.get('tab'), VALID_TABS) ?? 'pending',
    conversationType: parse(searchParams.get('conversation_type'), VALID_CONV_TYPES),
    bracket:          parse(searchParams.get('bracket'), VALID_BRACKETS),
    sort:             parse(searchParams.get('sort'), VALID_SORTS),
  }

  const update = useCallback(
    (patch: UrlPatch) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === undefined) params.delete(k)
        else params.set(k, v)
      }
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [router, pathname, searchParams],
  )

  return {
    ...state,
    // Tab switch resets all filter/sort params — they are tab-scoped UX and
    // persisting them caused "where's my row" wart (filters from one tab
    // hiding rows in the next). Only the tab param survives.
    setTab:              (t: ReviewStatus)          =>
      router.replace(`${pathname}?tab=${t}`, { scroll: false }),
    setConversationType: (c: ConversationType | null) => update({ conversation_type: c }),
    setBracket:          (b: Bracket | null)         => update({ bracket: b }),
    setSort:             (s: Sort | null)            => update({ sort: s }),
  }
}

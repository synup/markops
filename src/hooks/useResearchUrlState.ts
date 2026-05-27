'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'

export type ResearchTopTab = 'tool' | 'content' | 'feed'
export type ResearchStatus = 'all' | 'pending' | 'approved' | 'rejected'

export type ResearchUrlState = {
  topTab: ResearchTopTab
  status: ResearchStatus
}

const VALID_TABS: readonly ResearchTopTab[] = ['tool', 'content', 'feed']
const VALID_STATUSES: readonly ResearchStatus[] = ['all', 'pending', 'approved', 'rejected']

function parse<T extends string>(value: string | null, allowed: readonly T[]): T | null {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : null
}

export function useResearchUrlState(): ResearchUrlState & {
  setTopTab: (t: ResearchTopTab) => void
  setStatus: (s: ResearchStatus) => void
} {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const state: ResearchUrlState = {
    topTab: parse(searchParams.get('tab'), VALID_TABS) ?? 'tool',
    status: parse(searchParams.get('status'), VALID_STATUSES) ?? 'all',
  }

  const setTopTab = useCallback(
    (t: ResearchTopTab) => {
      router.replace(`${pathname}?tab=${t}`, { scroll: false })
    },
    [router, pathname],
  )

  const setStatus = useCallback(
    (s: ResearchStatus) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('status', s)
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [router, pathname, searchParams],
  )

  return { ...state, setTopTab, setStatus }
}

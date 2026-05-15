'use client'

import { useEffect, useRef } from 'react'

export type KeyboardNavArgs = {
  rowCount: number
  focusedIndex: number
  setFocusedIndex: (i: number) => void
  /** When true, only Escape is handled (drawer / help modal / picker open). */
  isDisabled: boolean
  onEnter: () => void
  onApprove: () => void
  onReject: () => void
  onEscape: () => void
  onHelpToggle: () => void
}

function shouldBail(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
  if (target.isContentEditable) return true
  if (target.getAttribute('role') === 'textbox') return true
  return false
}

export function useKeyboardNav(args: KeyboardNavArgs) {
  // Use a ref so handlers always see latest props without re-attaching the listener.
  const argsRef = useRef(args)
  useEffect(() => {
    argsRef.current = args
  })

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const a = argsRef.current
      if (shouldBail(e.target)) return

      // When disabled (drawer/help/picker open), only Escape works.
      if (a.isDisabled) {
        if (e.key === 'Escape') {
          e.preventDefault()
          a.onEscape()
        }
        return
      }

      // Ignore modified keys (cmd/ctrl/alt combos) — they're system shortcuts.
      if (e.metaKey || e.ctrlKey || e.altKey) return

      switch (e.key) {
        case 'j':
          e.preventDefault()
          if (a.rowCount === 0) return
          a.setFocusedIndex(Math.min(a.rowCount - 1, a.focusedIndex + 1))
          break
        case 'k':
          e.preventDefault()
          if (a.rowCount === 0) return
          a.setFocusedIndex(Math.max(0, a.focusedIndex - 1))
          break
        case 'Enter':
          e.preventDefault()
          a.onEnter()
          break
        case 'a':
        case 'A':
          e.preventDefault()
          a.onApprove()
          break
        case 'r':
        case 'R':
          e.preventDefault()
          a.onReject()
          break
        case 'Escape':
          e.preventDefault()
          a.onEscape()
          break
        case '?':
          e.preventDefault()
          a.onHelpToggle()
          break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
}

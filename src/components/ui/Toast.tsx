'use client'

import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react'

export type ToastVariant = 'success' | 'error' | 'info'

export type Toast = {
  id: number
  message: string
  variant: ToastVariant
  durationMs: number
}

export type AddToastOptions = {
  variant?: ToastVariant
  durationMs?: number
}

type ToastContextValue = {
  toasts: Toast[]
  addToast: (message: string, opts?: AddToastOptions) => number
  removeToast: (id: number) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

let nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const addToast = useCallback((message: string, opts?: AddToastOptions) => {
    const id = ++nextId
    const variant = opts?.variant ?? 'info'
    const durationMs = opts?.durationMs ?? 4000
    setToasts(prev => [...prev, { id, message, variant, durationMs }])
    return id
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  )
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: Toast[]
  onDismiss: (id: number) => void
}) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast
  onDismiss: (id: number) => void
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const enter = requestAnimationFrame(() => setVisible(true))
    let timer: ReturnType<typeof setTimeout> | null = null
    if (toast.durationMs > 0) {
      timer = setTimeout(() => onDismiss(toast.id), toast.durationMs)
    }
    return () => {
      cancelAnimationFrame(enter)
      if (timer) clearTimeout(timer)
    }
  }, [toast.durationMs, toast.id, onDismiss])

  const dotColor =
    toast.variant === 'success'
      ? 'bg-emerald-500'
      : toast.variant === 'error'
        ? 'bg-red-500'
        : 'bg-slate-400'

  return (
    <div
      className={`pointer-events-auto flex min-w-[280px] max-w-[400px] items-start gap-3 rounded-lg border-[0.5px] border-slate-200 bg-white px-4 py-3 shadow-md transition-all duration-200 ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
      }`}
      role="status"
    >
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotColor}`} aria-hidden="true" />
      <div className="flex-1 text-[14px] text-slate-800">{toast.message}</div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 text-slate-400 transition-colors duration-150 hover:text-slate-600"
        aria-label="Dismiss notification"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path
            d="M3 3L11 11M11 3L3 11"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  )
}

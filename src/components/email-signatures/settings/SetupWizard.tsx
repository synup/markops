'use client'

import { useState } from 'react'
import { Button } from '@/components/email-signatures/ui/Button'
import { CheckCircle, ArrowRight, RefreshCw } from 'lucide-react'

interface SetupWizardProps {
  onComplete: () => void
}

const STEPS = [
  { title: 'Test Google connection', description: 'Verify Domain-Wide Delegation is configured correctly.' },
  { title: 'Sync workspace users', description: 'Pull user data from Google Workspace Admin Directory.' },
  { title: 'Create your first signature', description: 'Design a signature template with variable tokens.' },
]

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Record<number, { ok: boolean; msg: string }>>({})

  const runStep = async () => {
    setLoading(true)
    try {
      if (current === 0) {
        const res = await fetch('/api/google/test-connection')
        const data = await res.json()
        setResults(r => ({ ...r, 0: { ok: res.ok, msg: data.message ?? data.error } }))
      } else if (current === 1) {
        const res = await fetch('/api/google/sync-users', { method: 'POST' })
        const data = await res.json()
        setResults(r => ({ ...r, 1: { ok: res.ok, msg: res.ok ? `Synced ${data.synced} users` : data.error } }))
      } else {
        onComplete()
        return
      }
      if (current < 2) setCurrent(c => c + 1)
    } catch (err: unknown) {
      setResults(r => ({ ...r, [current]: { ok: false, msg: err instanceof Error ? err.message : 'Failed' } }))
    }
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      {STEPS.map((step, i) => {
        const result = results[i]
        const done = result?.ok
        return (
          <div key={i} className="rounded-xl p-4 flex items-start gap-3" style={{
            background: i === current ? 'var(--surface)' : 'var(--surface-2)',
            border: `1px solid ${i === current ? 'var(--brand-border)' : 'var(--border)'}`,
            opacity: i > current && !done ? 0.5 : 1,
          }}>
            <div className="mt-0.5">
              {done ? (
                <CheckCircle className="w-5 h-5" style={{ color: 'var(--green)' }} />
              ) : (
                <span className="flex w-5 h-5 items-center justify-center rounded-full text-xs font-bold"
                  style={{ background: i === current ? 'var(--brand)' : 'var(--surface-3)', color: i === current ? '#fff' : 'var(--text-dim)' }}>
                  {i + 1}
                </span>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{step.title}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{step.description}</p>
              {result && !result.ok && (
                <p className="text-xs mt-2" style={{ color: 'var(--red)' }}>{result.msg}</p>
              )}
            </div>
          </div>
        )
      })}
      <Button onClick={runStep} loading={loading} className="w-full">
        {current === 2 ? (
          <><ArrowRight className="w-4 h-4" />Go to Company Data</>
        ) : (
          <><RefreshCw className="w-4 h-4" />{STEPS[current].title}</>
        )}
      </Button>
    </div>
  )
}

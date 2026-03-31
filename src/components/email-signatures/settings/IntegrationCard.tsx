'use client'

import { useState } from 'react'
import { Badge } from '@/components/email-signatures/ui/Badge'
import { Button } from '@/components/email-signatures/ui/Button'

interface IntegrationCardProps {
  name: string
  description: string
  logoEmoji: string
  isConnected: boolean
  onTest?: () => Promise<{ ok: boolean; message: string }>
}

export function IntegrationCard({ name, description, logoEmoji, isConnected, onTest }: IntegrationCardProps) {
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  const handleTest = async () => {
    if (!onTest) return
    setTesting(true)
    setResult(null)
    const res = await onTest()
    setResult(res)
    setTesting(false)
  }

  return (
    <div className="rounded-xl p-4 flex items-start gap-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <span className="text-2xl">{logoEmoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm" style={{ color: 'var(--text)' }}>{name}</span>
          <Badge variant={isConnected ? 'active' : 'draft'}>{isConnected ? 'Connected' : 'Not connected'}</Badge>
        </div>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{description}</p>
        {result && (
          <p className="text-xs mt-2" style={{ color: result.ok ? 'var(--green)' : 'var(--red)' }}>{result.message}</p>
        )}
      </div>
      {onTest && (
        <Button variant="secondary" size="sm" onClick={handleTest} loading={testing}>Test</Button>
      )}
    </div>
  )
}

'use client'

import { IntegrationCard } from '@/components/email-signatures/settings/IntegrationCard'

const testGoogleConnection = async (): Promise<{ ok: boolean; message: string }> => {
  try {
    const res = await fetch('/api/google/test-connection')
    const data = await res.json()
    return { ok: res.ok, message: data.message ?? data.error }
  } catch {
    return { ok: false, message: 'Connection failed' }
  }
}

const INTEGRATIONS = [
  {
    name: 'Google Workspace',
    description: 'Admin SDK (user sync) + Gmail API (signature deployment) via Domain-Wide Delegation.',
    emoji: '🔵',
    connected: true,
    onTest: testGoogleConnection,
  },
  {
    name: 'Apple Mail',
    description: 'Manual setup — export signature HTML and configure per device.',
    emoji: '✉️',
    connected: false,
  },
  {
    name: 'Outlook (Mac)',
    description: 'Deploy via HTML export or Exchange connector.',
    emoji: '📘',
    connected: false,
  },
  {
    name: 'Outlook Windows',
    description: 'Deploy via HTML export or Exchange connector.',
    emoji: '📗',
    connected: false,
  },
]

export default function IntegrationsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Integrations</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Connect your email providers to enable signature deployment.
        </p>
      </div>
      <div className="space-y-3">
        {INTEGRATIONS.map(i => (
          <IntegrationCard
            key={i.name}
            name={i.name}
            description={i.description}
            logoEmoji={i.emoji}
            isConnected={i.connected}
            onTest={i.onTest}
          />
        ))}
      </div>
    </div>
  )
}

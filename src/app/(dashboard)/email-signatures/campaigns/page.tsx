'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useESCampaigns } from '@/hooks/useESCampaigns'
import { CampaignCard } from '@/components/email-signatures/campaigns/CampaignCard'
import { CampaignForm } from '@/components/email-signatures/campaigns/CampaignForm'
import { Modal } from '@/components/email-signatures/ui/Modal'
import { Button } from '@/components/email-signatures/ui/Button'
import { EmptyState } from '@/components/email-signatures/ui/EmptyState'
import type { Campaign } from '@/types/email-signatures'

export default function CampaignsPage() {
  const { campaigns, loading, refetch } = useESCampaigns()
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Campaigns</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Time-bound banner images appended to signatures.
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" />Add Campaign
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl h-48 animate-pulse" style={{ background: 'var(--surface-2)' }} />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <EmptyState
          icon="📣"
          title="No campaigns yet"
          description="Create a time-bound banner campaign to promote events or announcements via email signatures."
          action={<Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4" />Add Campaign</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {campaigns.map(c => (
            <CampaignCard key={c.id} campaign={c as Campaign & { es_signatures?: { name: string } }} onDeleted={refetch} />
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Campaign" width="max-w-2xl">
        <CampaignForm onSaved={() => { setShowForm(false); refetch() }} onCancel={() => setShowForm(false)} />
      </Modal>
    </div>
  )
}

'use client'

import { format } from 'date-fns'
import { Trash2, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/email-signatures/ui/Badge'
import { Button } from '@/components/email-signatures/ui/Button'
import { createClient } from '@/lib/supabase/client'
import type { Campaign } from '@/types/email-signatures'

interface CampaignCardProps {
  campaign: Campaign & { es_signatures?: { name: string } }
  onDeleted: () => void
}

export function CampaignCard({ campaign, onDeleted }: CampaignCardProps) {
  const isExpired = campaign.end_date && new Date(campaign.end_date) < new Date()
  const statusVariant = !campaign.is_active ? 'draft' : isExpired ? 'draft' : 'active'
  const statusLabel = !campaign.is_active ? 'Inactive' : isExpired ? 'Expired' : 'Active'

  const handleDelete = async () => {
    if (!confirm(`Delete campaign "${campaign.name}"?`)) return
    const supabase = createClient()
    await supabase.from('es_campaigns').delete().eq('id', campaign.id)
    onDeleted()
  }

  return (
    <div className="rounded-xl overflow-hidden flex flex-col" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="relative h-36 overflow-hidden" style={{ background: 'var(--surface-2)' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={campaign.image_url} alt={campaign.name} className="w-full h-full object-cover" />
      </div>
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{campaign.name}</span>
          <Badge variant={statusVariant}>{statusLabel}</Badge>
        </div>
        <div className="text-xs space-y-1" style={{ color: 'var(--text-muted)' }}>
          <p>Signature: {campaign.es_signatures?.name ?? 'None'}</p>
          <p>
            {format(new Date(campaign.start_date), 'MMM d, yyyy')}
            {campaign.end_date ? ` — ${format(new Date(campaign.end_date), 'MMM d, yyyy')}` : ' — No end date'}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-auto">
          {campaign.link_url && (
            <a href={campaign.link_url} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm"><ExternalLink className="w-3.5 h-3.5" /></Button>
            </a>
          )}
          <Button variant="ghost" size="sm" onClick={handleDelete}><Trash2 className="w-3.5 h-3.5" /></Button>
        </div>
      </div>
    </div>
  )
}

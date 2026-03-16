'use client'

import { Topbar } from '@/components/layout/Topbar'
import { CampaignTable } from '@/components/features/campaigns/CampaignTable'
import { useLatestCampaignSnapshot } from '@/hooks/useCampaigns'

export default function CampaignsPage() {
  const { campaigns, loading, error } = useLatestCampaignSnapshot()

  return (
    <>
      <Topbar title="Campaigns" subtitle="Google Ads Campaign Analytics" />
      <div className="p-6">
        {error ? (
          <div className="py-12 text-center text-sm" style={{ color: '#ef4444' }}>
            {error}
          </div>
        ) : (
          <CampaignTable campaigns={campaigns} loading={loading} />
        )}
      </div>
    </>
  )
}

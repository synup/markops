'use client'

import type { CampaignMetric } from '@/types'

interface CampaignTableProps {
  campaigns: CampaignMetric[]
  loading: boolean
}

export function CampaignTable({ campaigns, loading }: CampaignTableProps) {
  if (loading) {
    return (
      <div className="py-12 text-center text-sm" style={{ color: 'var(--text-dim)' }}>
        Loading campaigns...
      </div>
    )
  }

  if (campaigns.length === 0) {
    return (
      <div className="py-12 text-center text-sm" style={{ color: 'var(--text-dim)' }}>
        No campaign data yet. Run an audit or wait for the weekly sync.
      </div>
    )
  }

  const totals = campaigns.reduce(
    (acc, c) => ({
      impressions: acc.impressions + c.impressions,
      clicks: acc.clicks + c.clicks,
      cost: acc.cost + c.cost,
      conversions: acc.conversions + c.conversions,
    }),
    { impressions: 0, clicks: 0, cost: 0, conversions: 0 }
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['Campaign', 'Type', 'Impressions', 'Clicks', 'CTR', 'Cost', 'Conv', 'CPC', 'ROAS'].map(h => (
              <th key={h} className="px-3 py-2 font-medium" style={{ color: 'var(--text-muted)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {campaigns.map(c => (
            <tr key={c.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <td className="max-w-[200px] truncate px-3 py-2.5 font-medium" style={{ color: 'var(--text)' }}>{c.campaign_name}</td>
              <td className="px-3 py-2.5" style={{ color: 'var(--text-muted)' }}>{c.campaign_type ?? '—'}</td>
              <td className="px-3 py-2.5" style={{ color: 'var(--text)' }}>{(c.impressions ?? 0).toLocaleString()}</td>
              <td className="px-3 py-2.5" style={{ color: 'var(--text)' }}>{(c.clicks ?? 0).toLocaleString()}</td>
              <td className="px-3 py-2.5" style={{ color: 'var(--text-muted)' }}>{((c.ctr ?? 0) * 100).toFixed(2)}%</td>
              <td className="px-3 py-2.5" style={{ color: 'var(--text)' }}>${(c.cost ?? 0).toFixed(2)}</td>
              <td className="px-3 py-2.5" style={{ color: (c.conversions ?? 0) > 0 ? '#22c55e' : 'var(--text-muted)' }}>{c.conversions ?? 0}</td>
              <td className="px-3 py-2.5" style={{ color: 'var(--text-muted)' }}>${(c.cpc ?? 0).toFixed(2)}</td>
              <td className="px-3 py-2.5" style={{ color: (c.roas ?? 0) >= 2 ? '#22c55e' : '#ef4444' }}>{(c.roas ?? 0).toFixed(1)}x</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ borderTop: '2px solid var(--border)' }}>
            <td className="px-3 py-2 font-semibold" style={{ color: 'var(--text)' }}>Totals</td>
            <td className="px-3 py-2"></td>
            <td className="px-3 py-2 font-semibold" style={{ color: 'var(--text)' }}>{totals.impressions.toLocaleString()}</td>
            <td className="px-3 py-2 font-semibold" style={{ color: 'var(--text)' }}>{totals.clicks.toLocaleString()}</td>
            <td className="px-3 py-2"></td>
            <td className="px-3 py-2 font-semibold" style={{ color: 'var(--text)' }}>${totals.cost.toFixed(2)}</td>
            <td className="px-3 py-2 font-semibold" style={{ color: 'var(--green)' }}>{totals.conversions}</td>
            <td colSpan={2}></td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

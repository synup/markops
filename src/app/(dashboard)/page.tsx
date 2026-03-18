'use client'

import { Topbar } from '@/components/layout/Topbar'
import { StatCard } from '@/components/ui/StatCard'
import { ScoreGauge } from '@/components/ui/ScoreGauge'
import { useLatestAudit } from '@/hooks/useAuditData'
import { useLatestCampaignSnapshot } from '@/hooks/useCampaigns'
import { LeadsSummaryCard } from '@/components/features/leads/LeadsSummaryCard'

export default function DashboardPage() {
  const { audit, loading: auditLoading } = useLatestAudit()
  const { campaigns, loading: campLoading } = useLatestCampaignSnapshot()

  const totalSpend = campaigns.reduce((s, c) => s + c.cost, 0)
  const totalConv = campaigns.reduce((s, c) => s + c.conversions, 0)
  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0)

  return (
    <>
      <Topbar title="Dashboard" subtitle="Marketing HQ Overview" />
      <div className="p-6">
        {auditLoading ? (
          <div className="py-12 text-center text-sm" style={{ color: 'var(--text-dim)' }}>
            Loading...
          </div>
        ) : !audit ? (
          <div className="py-12 text-center">
            <div className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
              No audit data yet
            </div>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              The first audit will run this Friday. Check back then.
            </p>
          </div>
        ) : (
          <>
            {/* Score + key stats */}
            <div className="mb-6 flex items-start gap-6">
              <ScoreGauge score={audit.score} grade={audit.grade} size="lg" />
              <div className="grid flex-1 grid-cols-4 gap-3">
                <StatCard label="Health Score" value={`${audit.score.toFixed(1)}/100`} subtext={`Grade ${audit.grade}`} />
                <StatCard label="Issues Found" value={audit.failed_checks} color="var(--red)" />
                <StatCard label="Checks Passed" value={audit.passed_checks} color="var(--green)" />
                <StatCard
                  label="Last Audit"
                  value={new Date(audit.run_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
              </div>
            </div>

            {/* Campaign summary */}
            {!campLoading && campaigns.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold" style={{ color: 'var(--text)' }}>
                  Campaign Summary
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  <StatCard label="Active Campaigns" value={campaigns.length} />
                  <StatCard label="Total Spend" value={`$${totalSpend.toLocaleString()}`} />
                  <StatCard label="Total Clicks" value={totalClicks.toLocaleString()} />
                  <StatCard label="Conversions" value={totalConv} color="var(--green)" />
                </div>
              </div>
            )}

        {/* Leads summary — always visible */}
        <LeadsSummaryCard />
          </>
        )}

        {/* Leads summary — always visible */}
      </div>
    </>
  )
}

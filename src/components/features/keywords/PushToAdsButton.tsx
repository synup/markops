'use client'

import { usePushToAds } from '@/hooks/usePushToAds'

export function PushToAdsButton() {
  const { latestPush, approvedCount, loading, requesting, requestPush } = usePushToAds()

  if (loading) return null

  const isPending = latestPush?.status === 'pending' || latestPush?.status === 'processing'
  const lastCompleted = latestPush?.status === 'completed'
  const lastFailed = latestPush?.status === 'failed'

  return (
    <div className="flex items-center gap-3">
      {/* Status of last push */}
      {isPending && (
        <span className="text-xs" style={{ color: '#F59E0B' }}>
          Push in progress...
        </span>
      )}
      {lastCompleted && latestPush && (
        <span className="text-xs" style={{ color: '#22C55E' }}>
          Last push: {latestPush.pushed_count} pushed
          {latestPush.failed_count > 0 && `, ${latestPush.failed_count} failed`}
        </span>
      )}
      {lastFailed && (
        <span className="text-xs" style={{ color: '#EF4444' }}>
          Last push failed
        </span>
      )}

      {/* Push button */}
      <button
        onClick={requestPush}
        disabled={approvedCount === 0 || requesting || isPending}
        className="rounded-lg px-4 py-2 text-xs font-semibold transition-opacity disabled:opacity-40"
        style={{ background: 'rgba(124,58,237,0.15)', color: '#7C3AED' }}
      >
        {isPending
          ? 'Pushing...'
          : requesting
            ? 'Requesting...'
            : `Push ${approvedCount} to Google Ads`}
      </button>
    </div>
  )
}

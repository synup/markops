'use client'

import { type ConversationRow } from '@/types/conversation'
import { ScoreBadge } from '@/components/ui/ScoreBadge'
import { Chip } from '@/components/ui/Chip'
import { Button } from '@/components/ui/Button'
import { ApprovalPicker, ASSET_TYPES, type AssetType } from './ApprovalPicker'
import { RejectInput } from './RejectInput'
import { ConversationBriefStatus } from './ConversationBriefStatus'

export type CardMode = 'collapsed' | 'approve' | 'reject'

const assetTypeLabel = (v: string | null) =>
  v == null ? null : ASSET_TYPES.find(a => a.value === v)?.label ?? v

const formatDate = (iso: string) => {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    }).format(new Date(iso))
  } catch { return iso }
}

const formatDuration = (s: number | null) => {
  if (!s || s <= 0) return null
  const m = Math.floor(s / 60)
  return m > 0 ? `${m} min` : `${s}s`
}

type Props = {
  row: ConversationRow
  focused?: boolean
  exiting?: boolean
  mode?: CardMode
  isApprovedTab?: boolean
  onModeChange?: (mode: CardMode) => void
  onOpenDrawer: (id: string) => void
  onApprove: (assetType: AssetType) => void
  onReject: (reason: string | null) => void
  onRevoke: () => void
}

export function InsightCard({
  row, focused, exiting, mode = 'collapsed', isApprovedTab = false,
  onModeChange, onOpenDrawer, onApprove, onReject, onRevoke,
}: Props) {
  const sc = row.sales_calls
  const customer = sc.customer_company || sc.customer_name || sc.title || '(unknown)'
  const subtitle = [
    sc.customer_name && sc.customer_company ? sc.customer_name : null,
    sc.rep_name,
    formatDate(sc.call_date),
    formatDuration(sc.call_duration_seconds),
  ].filter(Boolean).join(' · ')

  const shownAssetType =
    row.review_status === 'approved' ? row.approved_asset_type : row.suggested_asset_type

  const stop = (e: React.MouseEvent) => e.stopPropagation()

  return (
    <div
      onClick={() => mode === 'collapsed' && onOpenDrawer(row.id)}
      className={[
        'rounded-xl border-[0.5px] border-slate-200 bg-white p-5 transition-[transform,opacity,border-color,box-shadow] duration-[250ms]',
        mode === 'collapsed' ? 'cursor-pointer hover:border-slate-300 hover:shadow-sm' : '',
        focused ? 'ring-2 ring-cyan-500/40' : '',
        exiting ? 'translate-x-8 opacity-0' : '',
      ].filter(Boolean).join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-medium text-slate-900">{customer}</div>
          {subtitle && <div className="mt-0.5 text-[13px] text-slate-500">{subtitle}</div>}
        </div>
        <ScoreBadge score={row.composite_score} />
      </div>

      <p className="mt-3 text-[15px] leading-[1.65] text-slate-900">
        {row.problem_statement || sc.title || '(no summary)'}
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Chip label={sc.conversation_type} />
          {shownAssetType && <Chip label={assetTypeLabel(shownAssetType) || shownAssetType} />}
          {row.attribution_category && (
            <Chip
              label={row.attribution_detail
                ? `${row.attribution_category}: ${row.attribution_detail}`
                : row.attribution_category}
            />
          )}
        </div>

        <div className="flex flex-wrap gap-2" onClick={stop}>
          {row.review_status === 'pending' && (
            <>
              <Button variant="secondary" onClick={() => onModeChange?.('reject')}>Reject</Button>
              <Button variant="primary"   onClick={() => onModeChange?.('approve')}>Approve</Button>
            </>
          )}
          {row.review_status === 'approved' && (
            <>
              <Button variant="disabled" title="Coming in Phase 3b">View brief</Button>
              <ConversationBriefStatus callInsightId={row.id} enabled={isApprovedTab} />
              <Button variant="secondary" onClick={onRevoke}>Revoke</Button>
            </>
          )}
          {row.review_status === 'rejected' && (
            <Button variant="secondary" onClick={onRevoke}>Revoke</Button>
          )}
        </div>
      </div>

      {row.review_status === 'rejected' && row.rejection_reason && (
        <div className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-[13px] text-slate-600">
          <span className="font-medium text-slate-700">Reason:</span> {row.rejection_reason}
        </div>
      )}

      {mode === 'approve' && (
        <div onClick={stop}>
          <ApprovalPicker
            suggested={row.suggested_asset_type as AssetType | null}
            onConfirm={onApprove}
            onCancel={() => onModeChange?.('collapsed')}
          />
        </div>
      )}
      {mode === 'reject' && (
        <div onClick={stop}>
          <RejectInput
            onConfirm={onReject}
            onCancel={() => onModeChange?.('collapsed')}
          />
        </div>
      )}
    </div>
  )
}

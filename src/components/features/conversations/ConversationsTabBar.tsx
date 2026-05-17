import { type ReviewStatus, type Counts } from '@/types/conversation'

const TABS: Array<{ key: ReviewStatus; label: string }> = [
  { key: 'pending',  label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
]

type Props = {
  activeTab: ReviewStatus
  onTabChange: (tab: ReviewStatus) => void
  counts: Counts
}

export function ConversationsTabBar({ activeTab, onTabChange, counts }: Props) {
  return (
    <div className="flex gap-6 border-b border-slate-200">
      {TABS.map(t => {
        const active = t.key === activeTab
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onTabChange(t.key)}
            className={`-mb-px border-b-2 px-1 py-3 text-[14px] transition-colors duration-150 ${
              active
                ? 'border-cyan-500 font-medium text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span>{t.label}</span>{' '}
            <span className="text-slate-400">({counts[t.key]})</span>
          </button>
        )
      })}
    </div>
  )
}

'use client'

import { Topbar } from '@/components/layout/Topbar'
import { NegativeKeywordsList } from '@/components/features/keywords/NegativeKeywordsList'
import { useNegativeKeywords } from '@/hooks/useAuditData'

export default function KeywordsPage() {
  const { keywords, loading, updateStatus } = useNegativeKeywords()

  return (
    <>
      <Topbar title="Keywords" subtitle="Negative Keyword Management" />
      <div className="p-6">
        {loading ? (
          <div className="py-12 text-center text-sm" style={{ color: 'var(--text-dim)' }}>
            Loading...
          </div>
        ) : (
          <NegativeKeywordsList keywords={keywords} onUpdateStatus={updateStatus} />
        )}
      </div>
    </>
  )
}

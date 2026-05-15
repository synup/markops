import { Suspense } from 'react'
import { ConversationsContainer } from '@/components/features/conversations/ConversationsContainer'

export const metadata = { title: 'Conversations · Marketing HQ' }

// Wrapped in Suspense because ConversationsContainer's descendants use
// useSearchParams (via useUrlState), which Next 15 requires under a Suspense
// boundary to avoid a CSR bailout warning.
export default function ConversationsPage() {
  return (
    <Suspense fallback={null}>
      <ConversationsContainer />
    </Suspense>
  )
}

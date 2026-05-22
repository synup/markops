import { requireAdmin } from '@/lib/auth/requireAdmin'
import { BriefPromptsEditor } from '@/components/features/agents/BriefPromptsEditor'

export default async function BriefPromptsPage() {
  // Unauthenticated requests are bounced to /login by middleware; this gate
  // covers the authenticated-but-not-admin case with a friendly message
  // instead of letting requireAdmin's thrown Response surface as a 500.
  try {
    await requireAdmin()
  } catch {
    return (
      <div className="min-h-screen bg-slate-50 p-8 text-slate-700">
        <h1 className="text-lg font-medium">Admin only</h1>
        <p className="mt-2 text-sm">
          This page is restricted to admin users. Ask Niladri to grant you the admin role.
        </p>
      </div>
    )
  }

  return <BriefPromptsEditor />
}

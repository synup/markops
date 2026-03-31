'use client'

import { useRouter } from 'next/navigation'
import { SetupWizard } from '@/components/email-signatures/settings/SetupWizard'

export default function SetupPage() {
  const router = useRouter()
  return (
    <div className="max-w-lg mx-auto py-12 space-y-6">
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4"
          style={{ background: 'var(--brand)' }}>
          S
        </div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Set up Email Signatures</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Connect Google Workspace to start managing signatures</p>
      </div>
      <SetupWizard onComplete={() => router.push('/email-signatures/company-data')} />
    </div>
  )
}

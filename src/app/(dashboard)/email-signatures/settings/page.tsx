'use client'

import { GeneralSettings } from '@/components/email-signatures/settings/GeneralSettings'

export default function SettingsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>General</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Configure how email signatures behave across your organization.
        </p>
      </div>
      <GeneralSettings />
    </div>
  )
}

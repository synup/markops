import { GeneralSettings } from '@/components/email-signatures/settings/GeneralSettings'

export default function SettingsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Settings</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>General configuration for email signatures.</p>
      </div>
      <GeneralSettings />
    </div>
  )
}

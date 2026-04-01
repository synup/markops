'use client'

import { useState } from 'react'
import { Button } from '@/components/email-signatures/ui/Button'
import { ToggleRow } from './ToggleRow'
import { useESSettings } from '@/hooks/useESSettings'
import { Save } from 'lucide-react'
import { format } from 'date-fns'

export function GeneralSettings() {
  const { settings, lastSyncAt, loading, updateSetting } = useESSettings()
  const [activeSignature, setActiveSignature] = useState(true)
  const [emailAlias, setEmailAlias] = useState(false)
  const [groupSignature, setGroupSignature] = useState(false)
  const [customFields, setCustomFields] = useState(false)

  const handleAutoImportToggle = (enabled: boolean) => {
    updateSetting('auto_import_enabled', enabled ? 'true' : 'false')
  }

  const lastSyncLabel = lastSyncAt
    ? `Last sync: ${format(new Date(lastSyncAt), 'MMM d, yyyy h:mm a')}`
    : 'No sync yet'

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-16 rounded-lg animate-pulse" style={{ background: 'var(--surface-2)' }} />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <ToggleRow
          title="Active Signature"
          description="Enable or disable signature deployment for all users. When off, no signatures will be pushed to Gmail."
          checked={activeSignature}
          onChange={setActiveSignature}
        />
        <ToggleRow
          title="Automated User Import"
          description={`New users are automatically imported from Google Workspace daily at 2am. ${lastSyncLabel}`}
          checked={settings.auto_import_enabled}
          onChange={handleAutoImportToggle}
        />
        <ToggleRow
          title="Email Alias"
          description="Deploy signatures to email aliases in addition to the primary address."
          checked={emailAlias}
          onChange={setEmailAlias}
        />
        <ToggleRow
          title="Group Signature"
          description="Allow assigning a shared signature to Google Groups."
          checked={groupSignature}
          onChange={setGroupSignature}
        />
        <ToggleRow
          title="Custom Fields"
          description="Enable custom token fields beyond the standard set (name, title, department, phone)."
          checked={customFields}
          onChange={setCustomFields}
          last
        />
      </div>
      <div className="flex justify-end">
        <Button><Save className="w-4 h-4" />Save Changes</Button>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { UserTable } from '@/components/email-signatures/company-data/UserTable'
import { UserAssignmentModal } from '@/components/email-signatures/company-data/UserAssignmentModal'
import { Button } from '@/components/email-signatures/ui/Button'
import { RefreshCw } from 'lucide-react'
import type { WorkspaceUser } from '@/types/email-signatures'

export default function CompanyDataPage() {
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')
  const [editUser, setEditUser] = useState<WorkspaceUser | null>(null)
  const [tableKey, setTableKey] = useState(0)

  const handleSync = async () => {
    setSyncing(true)
    setSyncMsg('')
    try {
      const res = await fetch('/api/google/sync-users', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSyncMsg(`Synced ${data.synced} users`)
      setTableKey(k => k + 1)
    } catch (e: unknown) {
      setSyncMsg(`Error: ${e instanceof Error ? e.message : 'Unknown'}`)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Company Data</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            All users synced from Google Workspace. Click a user to assign a signature.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {syncMsg && <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{syncMsg}</span>}
          <Button variant="secondary" onClick={handleSync} loading={syncing}>
            <RefreshCw className="w-4 h-4" />Import Now
          </Button>
        </div>
      </div>

      <UserTable key={tableKey} onEditUser={setEditUser} />

      <UserAssignmentModal
        user={editUser}
        onClose={() => setEditUser(null)}
        onSaved={() => setTableKey(k => k + 1)}
      />
    </div>
  )
}

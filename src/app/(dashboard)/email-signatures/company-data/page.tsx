'use client'

import { useState } from 'react'
import { UserTable } from '@/components/email-signatures/company-data/UserTable'
import { Modal } from '@/components/email-signatures/ui/Modal'
import { Button } from '@/components/email-signatures/ui/Button'
import { RefreshCw } from 'lucide-react'
import type { WorkspaceUser } from '@/types/email-signatures'

export default function CompanyDataPage() {
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')
  const [editUser, setEditUser] = useState<WorkspaceUser | null>(null)

  const handleSync = async () => {
    setSyncing(true)
    setSyncMsg('')
    try {
      const res = await fetch('/api/google/sync-users', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSyncMsg(`Synced ${data.synced} users`)
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
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>All users synced from Google Workspace</p>
        </div>
        <div className="flex items-center gap-3">
          {syncMsg && <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{syncMsg}</span>}
          <Button variant="secondary" onClick={handleSync} loading={syncing}>
            <RefreshCw className="w-4 h-4" />Import Now
          </Button>
        </div>
      </div>

      <UserTable onEditUser={setEditUser} />

      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Edit user assignment">
        {editUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold"
                style={{ background: 'var(--brand-muted)', color: 'var(--brand)' }}>
                {(editUser.first_name?.[0] ?? editUser.email[0]).toUpperCase()}
              </div>
              <div>
                <p className="font-medium" style={{ color: 'var(--text)' }}>{editUser.first_name} {editUser.last_name}</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{editUser.email}</p>
              </div>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Use the Signature Management page to assign signatures to individual users.
            </p>
            <Button variant="secondary" onClick={() => setEditUser(null)} className="w-full">Close</Button>
          </div>
        )}
      </Modal>
    </div>
  )
}

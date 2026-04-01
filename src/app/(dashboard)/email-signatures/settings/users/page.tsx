'use client'

import { AdminUserTable } from '@/components/email-signatures/settings/AdminUserTable'

export default function UserAccessPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>User Access Management</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Control who can access this admin tool.
        </p>
      </div>
      <AdminUserTable />
    </div>
  )
}

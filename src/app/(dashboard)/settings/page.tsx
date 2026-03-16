'use client'

import { useState } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { useAuth } from '@/hooks/useAuth'
import { useAuditSchedule } from '@/hooks/useAuditSchedule'
import { ScheduleDisplay } from '@/components/features/schedule/ScheduleDisplay'
import { ScheduleForm } from '@/components/features/schedule/ScheduleForm'
import { UserManagement } from '@/components/features/users/UserManagement'

export default function SettingsPage() {
  const { user, profile } = useAuth()
  const { schedule, loading, saving, saveSchedule, toggleEnabled, deleteSchedule } = useAuditSchedule()
  const [editing, setEditing] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const isAdmin = profile?.role === 'admin'

  const handleSave = async (data: Record<string, unknown>) => {
    await saveSchedule(data)
    setEditing(false)
    setShowForm(false)
  }

  return (
    <>
      <Topbar title="Settings" subtitle="Users & Configuration" />
      <div className="p-6 max-w-2xl flex flex-col gap-6">
        <ProfileCard profile={profile} />

        <ScheduleSection
          schedule={schedule}
          loading={loading}
          saving={saving}
          editing={editing}
          showForm={showForm}
          onEdit={() => setEditing(true)}
          onToggle={toggleEnabled}
          onDelete={deleteSchedule}
          onSave={handleSave}
          onCancel={() => { setEditing(false); setShowForm(false) }}
          onCreateNew={() => setShowForm(true)}
        />

        {isAdmin && user && <UserManagement currentUserId={user.id} />}
      </div>
    </>
  )
}

function ProfileCard({ profile }: { profile: { email?: string | null; full_name?: string | null; role?: string | null } | null }) {
  const roleColor = profile?.role === 'admin' ? '#7c3aed' : profile?.role === 'editor' ? '#3b82f6' : '#6b7280'
  return (
    <div className="rounded-lg p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <h3 className="mb-4 text-sm font-semibold" style={{ color: 'var(--text)' }}>Your Profile</h3>
      <div className="flex flex-col gap-3 text-sm">
        <div className="flex justify-between">
          <span style={{ color: 'var(--text-muted)' }}>Email</span>
          <span style={{ color: 'var(--text)' }}>{profile?.email}</span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: 'var(--text-muted)' }}>Name</span>
          <span style={{ color: 'var(--text)' }}>{profile?.full_name ?? '—'}</span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: 'var(--text-muted)' }}>Role</span>
          <span className="rounded px-2 py-0.5 text-xs font-medium" style={{ background: `${roleColor}22`, color: roleColor }}>
            {profile?.role ?? 'viewer'}
          </span>
        </div>
      </div>
    </div>
  )
}

interface ScheduleSectionProps {
  schedule: ReturnType<typeof useAuditSchedule>['schedule']
  loading: boolean
  saving: boolean
  editing: boolean
  showForm: boolean
  onEdit: () => void
  onToggle: () => void
  onDelete: () => void
  onSave: (data: Record<string, unknown>) => void
  onCancel: () => void
  onCreateNew: () => void
}

function ScheduleSection({ schedule, loading, saving, editing, showForm, onEdit, onToggle, onDelete, onSave, onCancel, onCreateNew }: ScheduleSectionProps) {
  if (loading) {
    return <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading schedule...</p>
  }
  if (editing || showForm) {
    return (
      <ScheduleForm
        initial={schedule ? {
          frequency: schedule.frequency, day_of_week: schedule.day_of_week,
          day_of_month: schedule.day_of_month, hour: schedule.hour,
          minute: schedule.minute, timezone: schedule.timezone,
        } : undefined}
        saving={saving} onSave={onSave} onCancel={onCancel}
      />
    )
  }
  if (schedule) {
    return <ScheduleDisplay schedule={schedule} onEdit={onEdit} onToggle={onToggle} onDelete={onDelete} />
  }
  return (
    <div className="rounded-lg p-5 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <p className="mb-1 text-sm font-medium" style={{ color: 'var(--text)' }}>No audit schedule configured</p>
      <p className="mb-4 text-xs" style={{ color: 'var(--text-muted)' }}>Set up automatic audits so you never miss a check.</p>
      <button onClick={onCreateNew} className="rounded px-4 py-2 text-sm font-medium text-white" style={{ background: '#3b82f6' }}>
        Create Schedule
      </button>
    </div>
  )
}

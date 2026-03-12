'use client'

import { AuditSchedule, formatNextRun } from '@/hooks/useAuditSchedule'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface ScheduleDisplayProps {
  schedule: AuditSchedule
  onEdit: () => void
  onToggle: () => void
  onDelete: () => void
}

export function ScheduleDisplay({ schedule, onEdit, onToggle, onDelete }: ScheduleDisplayProps) {
  const frequencyLabel = () => {
    if (schedule.frequency === 'daily') return 'Every day'
    if (schedule.frequency === 'weekly' && schedule.day_of_week != null) {
      return `Every ${DAYS[schedule.day_of_week]}`
    }
    if (schedule.frequency === 'biweekly' && schedule.day_of_week != null) {
      return `Every other ${DAYS[schedule.day_of_week]}`
    }
    if (schedule.frequency === 'monthly') {
      return `Monthly on the ${schedule.day_of_month}${ordinal(schedule.day_of_month ?? 1)}`
    }
    return schedule.frequency
  }

  const timeLabel = () => {
    const h = schedule.hour
    const m = String(schedule.minute).padStart(2, '0')
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
    return `${h12}:${m} ${ampm}`
  }

  return (
    <div
      className="rounded-lg p-5"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: schedule.enabled ? '#22c55e' : '#6b7280' }}
          />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            Scheduled Audit
          </h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onToggle}
            className="rounded px-3 py-1 text-xs font-medium"
            style={{
              background: schedule.enabled ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
              color: schedule.enabled ? '#ef4444' : '#22c55e',
            }}
          >
            {schedule.enabled ? 'Pause' : 'Resume'}
          </button>
          <button
            onClick={onEdit}
            className="rounded px-3 py-1 text-xs font-medium"
            style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}
          >
            Edit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-y-3 text-sm">
        <Row label="Frequency" value={frequencyLabel()} />
        <Row label="Time" value={timeLabel()} />
        <Row label="Timezone" value={schedule.timezone.replace(/_/g, ' ')} />
        <Row label="Next Run" value={formatNextRun(schedule)} />
        {schedule.last_triggered_at && (
          <Row
            label="Last Run"
            value={new Date(schedule.last_triggered_at).toLocaleString(undefined, {
              month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
            })}
          />
        )}
      </div>

      <button
        onClick={onDelete}
        className="mt-4 text-xs"
        style={{ color: 'var(--text-muted)' }}
      >
        Remove schedule
      </button>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ color: 'var(--text)' }}>{value}</span>
    </>
  )
}

function ordinal(n: number): string {
  if (n > 3 && n < 21) return 'th'
  switch (n % 10) {
    case 1: return 'st'
    case 2: return 'nd'
    case 3: return 'rd'
    default: return 'th'
  }
}

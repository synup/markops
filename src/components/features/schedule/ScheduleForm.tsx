'use client'

import { useState } from 'react'
import { getLocalTimezone } from '@/hooks/useAuditSchedule'
import { TimezoneSelect } from './TimezoneSelect'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 Weeks' },
  { value: 'monthly', label: 'Monthly' },
]

interface ScheduleFormProps {
  initial?: {
    frequency?: string
    day_of_week?: number | null
    day_of_month?: number | null
    hour?: number
    minute?: number
    timezone?: string
  }
  saving: boolean
  onSave: (data: Record<string, unknown>) => void
  onCancel: () => void
}

export function ScheduleForm({ initial, saving, onSave, onCancel }: ScheduleFormProps) {
  const [frequency, setFrequency] = useState(initial?.frequency ?? 'weekly')
  const [dayOfWeek, setDayOfWeek] = useState(initial?.day_of_week ?? 5)
  const [dayOfMonth, setDayOfMonth] = useState(initial?.day_of_month ?? 1)
  const [hour, setHour] = useState(initial?.hour ?? 9)
  const [minute, setMinute] = useState(initial?.minute ?? 0)
  const [timezone, setTimezone] = useState(initial?.timezone ?? getLocalTimezone())

  const selectStyle = { background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }

  const handleSave = () => {
    onSave({
      frequency,
      day_of_week: frequency === 'monthly' ? null : dayOfWeek,
      day_of_month: frequency === 'monthly' ? dayOfMonth : null,
      hour, minute, timezone, enabled: true,
    })
  }

  return (
    <div className="rounded-lg p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <h3 className="mb-4 text-sm font-semibold" style={{ color: 'var(--text)' }}>
        {initial ? 'Edit Schedule' : 'Set Up Audit Schedule'}
      </h3>

      <div className="flex flex-col gap-4">
        <Field label="How often?">
          <select value={frequency} onChange={e => setFrequency(e.target.value)}
            className="w-full rounded-md px-2.5 py-1.5 text-sm" style={selectStyle}>
            {FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </Field>

        {(frequency === 'weekly' || frequency === 'biweekly') && (
          <Field label="Day of week">
            <select value={dayOfWeek} onChange={e => setDayOfWeek(Number(e.target.value))}
              className="w-full rounded-md px-2.5 py-1.5 text-sm" style={selectStyle}>
              {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </Field>
        )}

        {frequency === 'monthly' && (
          <Field label="Day of month">
            <select value={dayOfMonth} onChange={e => setDayOfMonth(Number(e.target.value))}
              className="w-full rounded-md px-2.5 py-1.5 text-sm" style={selectStyle}>
              {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </Field>
        )}

        <Field label="Time">
          <div className="flex gap-2 items-center">
            <select value={hour} onChange={e => setHour(Number(e.target.value))}
              className="rounded-md px-2.5 py-1.5 text-sm" style={selectStyle}>
              {Array.from({ length: 24 }, (_, i) => i).map(h => (
                <option key={h} value={h}>
                  {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`}
                </option>
              ))}
            </select>
            <span style={{ color: 'var(--text-muted)' }}>:</span>
            <select value={minute} onChange={e => setMinute(Number(e.target.value))}
              className="rounded-md px-2.5 py-1.5 text-sm" style={selectStyle}>
              {[0, 15, 30, 45].map(m => (
                <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
              ))}
            </select>
          </div>
        </Field>

        <TimezoneSelect value={timezone} onChange={setTimezone} />
      </div>

      <div className="mt-5 flex gap-3">
        <button onClick={handleSave} disabled={saving}
          className="rounded px-4 py-2 text-sm font-medium text-white"
          style={{ background: '#3b82f6', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving...' : 'Save Schedule'}
        </button>
        <button onClick={onCancel} className="rounded px-4 py-2 text-sm font-medium"
          style={{ color: 'var(--text-muted)' }}>
          Cancel
        </button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</label>
      {children}
    </div>
  )
}

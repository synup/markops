'use client'

import { getLocalTimezone } from '@/hooks/useAuditSchedule'

const COMMON_TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Anchorage', 'Pacific/Honolulu', 'Europe/London', 'Europe/Berlin',
  'Asia/Kolkata', 'Asia/Tokyo', 'Australia/Sydney', 'UTC',
]

interface TimezoneSelectProps {
  value: string
  onChange: (tz: string) => void
}

export function TimezoneSelect({ value, onChange }: TimezoneSelectProps) {
  const tzLabel = (tz: string) => {
    try {
      const offset = new Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'short' })
        .formatToParts(new Date())
        .find(p => p.type === 'timeZoneName')?.value ?? ''
      return `${tz.replace(/_/g, ' ')} (${offset})`
    } catch {
      return tz
    }
  }

  return (
    <div>
      <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
        Timezone
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-md px-2.5 py-1.5 text-sm"
        style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
      >
        {COMMON_TIMEZONES.map(tz => (
          <option key={tz} value={tz}>{tzLabel(tz)}</option>
        ))}
      </select>
      <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
        Detected: {getLocalTimezone().replace(/_/g, ' ')}
      </p>
    </div>
  )
}

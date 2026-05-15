import { type SalesCallEmbed } from '@/types/conversation'

const formatDateTime = (iso: string) => {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    }).format(new Date(iso))
  } catch { return iso }
}

const formatDuration = (s: number | null) => {
  if (!s || s <= 0) return null
  const m = Math.floor(s / 60)
  return m > 0 ? `${m} min` : `${s}s`
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 text-[13px]">
      <span className="text-slate-500">{label}</span>
      <span className="max-w-[60%] truncate text-right text-slate-700">{value}</span>
    </div>
  )
}

export function DrawerMetadata({ sc }: { sc: SalesCallEmbed }) {
  return (
    <section>
      <h3 className="mb-2 text-[14px] font-medium text-slate-700">Meeting</h3>
      <div className="space-y-1">
        <Row label="Title"    value={sc.title || '—'} />
        <Row label="Date"     value={formatDateTime(sc.call_date)} />
        <Row label="Duration" value={formatDuration(sc.call_duration_seconds) || '—'} />
        <Row label="Pipeline" value={sc.pipeline || '—'} />
        <Row label="Rep"      value={sc.rep_name || sc.rep_email || '—'} />
        <Row label="Customer" value={sc.customer_email || '—'} />
      </div>
    </section>
  )
}

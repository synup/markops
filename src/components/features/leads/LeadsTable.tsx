'use client'

import type { TallyLead } from '@/types'

const COLUMNS = ['Date', 'Name', 'Email', 'Company', 'Form', 'Employees', 'Business Type', 'Source']

export function LeadsTable({ leads }: { leads: TallyLead[] }) {
  if (leads.length === 0) {
    return (
      <div className="py-12 text-center text-sm" style={{ color: 'var(--text-dim)' }}>
        No leads match the current filters.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {COLUMNS.map((h) => (
              <th
                key={h}
                className="px-3 py-2.5 text-left font-semibold"
                style={{ color: 'var(--text-muted)' }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <LeadsTableRow key={lead.id} lead={lead} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function LeadsTableRow({ lead }: { lead: TallyLead }) {
  return (
    <tr
      className="transition-colors"
      style={{ borderBottom: '1px solid var(--border-subtle)' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <td className="whitespace-nowrap px-3 py-2.5" style={{ color: 'var(--text-muted)' }}>
        {new Date(lead.submitted_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </td>
      <td className="px-3 py-2.5 font-medium" style={{ color: 'var(--text)' }}>
        {lead.full_name || '—'}
      </td>
      <td className="px-3 py-2.5" style={{ color: 'var(--text)' }}>
        {lead.email || '—'}
      </td>
      <td className="px-3 py-2.5" style={{ color: 'var(--text)' }}>
        {lead.company_name || '—'}
      </td>
      <td className="px-3 py-2.5">
        <FormBadge formName={lead.form_name} />
      </td>
      <td className="px-3 py-2.5" style={{ color: 'var(--text-muted)' }}>
        {lead.employee_count || '—'}
      </td>
      <td className="px-3 py-2.5" style={{ color: 'var(--text-muted)' }}>
        {lead.business_type || '—'}
      </td>
      <td className="px-3 py-2.5" style={{ color: 'var(--text-muted)' }}>
        {lead.attribution_source || '—'}
      </td>
    </tr>
  )
}

function FormBadge({ formName }: { formName: string }) {
  const isDemo = formName === 'Book a Demo'
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
      style={{
        background: isDemo
          ? 'color-mix(in srgb, var(--brand) 15%, transparent)'
          : 'color-mix(in srgb, var(--green) 15%, transparent)',
        color: isDemo ? 'var(--brand)' : 'var(--green)',
      }}
    >
      {formName}
    </span>
  )
}

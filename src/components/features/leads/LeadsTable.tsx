'use client'

import type { TallyLead } from '@/types'
import { LeadsTableRow } from './LeadsTableRow'

const COLUMNS = ['Date', 'First Name', 'Last Name', 'Email', 'Company', 'Form', 'Employees', 'Business Type', 'Source']

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

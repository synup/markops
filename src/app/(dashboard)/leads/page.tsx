'use client'

import { useState, useMemo } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { StatCard } from '@/components/ui/StatCard'
import { FilterSelect, DateInput } from '@/components/features/leads/LeadsFilters'
import { LeadsTable } from '@/components/features/leads/LeadsTable'
import {
  useLeads,
  useAttributionSources,
  useBusinessTypes,
  FORM_OPTIONS,
  EMPLOYEE_COUNT_OPTIONS,
} from '@/hooks/leads'
import type { LeadsFilters } from '@/types'

export default function LeadsPage() {
  const defaultFrom = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  }, [])
  const defaultTo = useMemo(() => new Date().toISOString().split('T')[0], [])

  const [filters, setFilters] = useState<LeadsFilters>({
    dateFrom: defaultFrom,
    dateTo: defaultTo,
    formName: null,
    employeeCount: null,
    businessType: null,
    attributionSource: null,
  })

  const { leads, loading, error, totalCount } = useLeads(filters)
  const attributionSources = useAttributionSources()
  const businessTypes = useBusinessTypes()

  const updateFilter = <K extends keyof LeadsFilters>(key: K, value: LeadsFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      dateFrom: defaultFrom, dateTo: defaultTo,
      formName: null, employeeCount: null, businessType: null, attributionSource: null,
    })
  }

  const demoCount = leads.filter((l) => l.form_name === 'Book a Demo').length
  const contactCount = leads.filter((l) => l.form_name === 'Contact Us').length
  const todayStr = new Date().toISOString().split('T')[0]
  const todayCount = leads.filter((l) => l.submitted_at.startsWith(todayStr)).length
  const hasActiveFilters =
    filters.formName || filters.employeeCount || filters.businessType || filters.attributionSource

  return (
    <>
      <Topbar title="Leads" subtitle="Tally.so form submissions" />
      <div className="p-6">
        <div
          className="mb-4 rounded-lg p-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>Filters</span>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-[11px] font-medium hover:opacity-70" style={{ color: 'var(--red)' }}>
                Clear filters
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <DateInput label="From" value={filters.dateFrom} onChange={(v) => updateFilter('dateFrom', v)} />
            <DateInput label="To" value={filters.dateTo} onChange={(v) => updateFilter('dateTo', v)} />
            <FilterSelect label="Form" value={filters.formName} options={FORM_OPTIONS} onChange={(v) => updateFilter('formName', v)} />
            <FilterSelect label="Employee count" value={filters.employeeCount} options={EMPLOYEE_COUNT_OPTIONS} onChange={(v) => updateFilter('employeeCount', v)} />
            <FilterSelect label="Business type" value={filters.businessType} options={businessTypes} onChange={(v) => updateFilter('businessType', v)} />
            <FilterSelect label="Attribution source" value={filters.attributionSource} options={attributionSources} onChange={(v) => updateFilter('attributionSource', v)} />
          </div>
        </div>

        <div className="mb-4 grid grid-cols-4 gap-3">
          <StatCard label="Total Leads" value={totalCount} subtext="matching filters" />
          <StatCard label="Book a Demo" value={demoCount} color="var(--brand)" />
          <StatCard label="Contact Us" value={contactCount} color="var(--green)" />
          <StatCard label="Today" value={todayCount} subtext={todayStr} />
        </div>

        {error && (
          <div className="mb-4 rounded-lg p-3 text-sm" style={{ background: 'var(--red-bg)', color: 'var(--red)' }}>
            {error}
          </div>
        )}

        <div className="rounded-lg" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
              {loading ? 'Loading...' : `${totalCount} lead${totalCount !== 1 ? 's' : ''}`}
            </span>
            <span className="text-[11px]" style={{ color: 'var(--text-dim)' }}>
              Phase 2: ZohoCRM enrichment coming soon
            </span>
          </div>
          {loading ? (
            <div className="py-12 text-center text-sm" style={{ color: 'var(--text-dim)' }}>Loading leads...</div>
          ) : (
            <LeadsTable leads={leads} />
          )}
        </div>
      </div>
    </>
  )
}

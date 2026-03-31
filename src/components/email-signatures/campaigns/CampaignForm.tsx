'use client'

import { useState } from 'react'
import { useESSignatures } from '@/hooks/useESSignatures'
import { Button } from '@/components/email-signatures/ui/Button'
import { UTMBuilder } from './UTMBuilder'

interface CampaignFormProps {
  onSaved: () => void
  onCancel: () => void
}

export function CampaignForm({ onSaved, onCancel }: CampaignFormProps) {
  const { signatures } = useESSignatures()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', image_url: '', link_url: '', signature_id: '',
    start_date: '', end_date: '',
    utm_source: '', utm_medium: 'email', utm_campaign: '', utm_content: '',
  })

  const update = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/email-campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        signature_id: form.signature_id || null,
        end_date: form.end_date || null,
      }),
    })
    setSaving(false)
    if (res.ok) onSaved()
  }

  const inputStyle: React.CSSProperties = {
    background: 'var(--surface-2)', color: 'var(--text)',
    border: '1px solid var(--border)',
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Campaign name</label>
        <input required value={form.name} onChange={e => update('name', e.target.value)}
          className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Banner image URL</label>
        <input required value={form.image_url} onChange={e => update('image_url', e.target.value)}
          className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} placeholder="https://..." />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Link URL</label>
        <input value={form.link_url} onChange={e => update('link_url', e.target.value)}
          className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Signature</label>
        <select value={form.signature_id} onChange={e => update('signature_id', e.target.value)}
          className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}>
          <option value="">All signatures</option>
          {signatures.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Start date</label>
          <input required type="date" value={form.start_date} onChange={e => update('start_date', e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>End date</label>
          <input type="date" value={form.end_date} onChange={e => update('end_date', e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
        </div>
      </div>
      <UTMBuilder form={form} onUpdate={update} />
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={saving}>Create Campaign</Button>
      </div>
    </form>
  )
}

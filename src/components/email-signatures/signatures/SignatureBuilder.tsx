'use client'

import { useState, useEffect } from 'react'
import { generateSignatureHtml, type SignatureConfig } from '@/lib/signatures/generateSignatureHtml'

interface SignatureBuilderProps {
  onChange: (html: string) => void
}

const DEFAULT_CONFIG: SignatureConfig = {
  showPhone: true,
  showSocial: true,
  twitterUrl: 'https://twitter.com/synup',
  linkedinUrl: 'https://www.linkedin.com/company/9322483/',
  nameColor: '#3498db',
  showBanner: false,
  bannerImageUrl: '',
  bannerLinkUrl: '',
  utmSource: '',
  utmMedium: 'email signature',
  utmCampaign: '',
  utmContent: '',
}

const inputStyle: React.CSSProperties = {
  background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)',
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm" style={{ color: 'var(--text)' }}>{label}</span>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
    </div>
  )
}

function Field({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div className="py-1">
      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-lg px-3 py-1.5 text-sm outline-none" style={inputStyle} />
    </div>
  )
}

export function SignatureBuilder({ onChange }: SignatureBuilderProps) {
  const [config, setConfig] = useState<SignatureConfig>(DEFAULT_CONFIG)

  const set = (key: keyof SignatureConfig, value: string | boolean) =>
    setConfig(prev => ({ ...prev, [key]: value }))

  useEffect(() => {
    onChange(generateSignatureHtml(config))
  }, [config, onChange])

  return (
    <div className="p-4 space-y-4 overflow-y-auto">
      {/* Personal info */}
      <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Personal Info</h4>
        <Toggle label="Show phone number" checked={config.showPhone} onChange={v => set('showPhone', v)} />
      </div>

      {/* Branding */}
      <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Branding</h4>
        <div className="flex items-center justify-between py-2">
          <span className="text-sm" style={{ color: 'var(--text)' }}>Name colour</span>
          <input type="color" value={config.nameColor} onChange={e => set('nameColor', e.target.value)}
            className="w-8 h-8 cursor-pointer border-0 p-0 bg-transparent rounded" />
        </div>
        <Toggle label="Show social icons" checked={config.showSocial} onChange={v => set('showSocial', v)} />
        {config.showSocial && (
          <>
            <Field label="Twitter URL" value={config.twitterUrl} onChange={v => set('twitterUrl', v)} />
            <Field label="LinkedIn URL" value={config.linkedinUrl} onChange={v => set('linkedinUrl', v)} />
          </>
        )}
      </div>

      {/* Banner */}
      <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Banner</h4>
        <Toggle label="Show banner" checked={config.showBanner} onChange={v => set('showBanner', v)} />
        {config.showBanner && (
          <>
            <Field label="Banner image URL" value={config.bannerImageUrl} onChange={v => set('bannerImageUrl', v)} placeholder="https://..." />
            <Field label="Banner destination URL" value={config.bannerLinkUrl} onChange={v => set('bannerLinkUrl', v)} placeholder="https://..." />
            <div className="mt-2 rounded-lg p-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>UTM Parameters</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] mb-0.5" style={{ color: 'var(--text-dim)' }}>Source</label>
                  <input value={config.utmSource} onChange={e => set('utmSource', e.target.value)}
                    className="w-full rounded px-2 py-1 text-xs outline-none" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-[10px] mb-0.5" style={{ color: 'var(--text-dim)' }}>Medium</label>
                  <input value={config.utmMedium} onChange={e => set('utmMedium', e.target.value)}
                    className="w-full rounded px-2 py-1 text-xs outline-none" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-[10px] mb-0.5" style={{ color: 'var(--text-dim)' }}>Campaign</label>
                  <input value={config.utmCampaign} onChange={e => set('utmCampaign', e.target.value)}
                    className="w-full rounded px-2 py-1 text-xs outline-none" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-[10px] mb-0.5" style={{ color: 'var(--text-dim)' }}>Content</label>
                  <input value={config.utmContent} onChange={e => set('utmContent', e.target.value)}
                    className="w-full rounded px-2 py-1 text-xs outline-none" style={inputStyle} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

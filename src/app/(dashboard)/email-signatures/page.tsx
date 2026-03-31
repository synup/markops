'use client'

import { useState } from 'react'
import { Plus, Rocket } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { SignatureList } from '@/components/email-signatures/signatures/SignatureList'
import { Modal } from '@/components/email-signatures/ui/Modal'
import { Button } from '@/components/email-signatures/ui/Button'

export default function SignaturesPage() {
  const router = useRouter()
  const [deploying, setDeploying] = useState(false)
  const [deployResult, setDeployResult] = useState<{ success: number; failed: number; total: number } | null>(null)
  const [deployModal, setDeployModal] = useState(false)

  const handleDeployAll = async () => {
    setDeploying(true)
    try {
      const res = await fetch('/api/signatures/deploy', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setDeployResult(data)
      setDeployModal(true)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Deploy failed')
    } finally {
      setDeploying(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Signature Management</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            User-specific overrides take priority over the org default.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={handleDeployAll} loading={deploying}>
            <Rocket className="w-4 h-4" />Deploy All
          </Button>
          <Button onClick={() => router.push('/email-signatures/new/edit')}>
            <Plus className="w-4 h-4" />Add Signature
          </Button>
        </div>
      </div>

      <SignatureList onDeploy={handleDeployAll} />

      <Modal open={deployModal} onClose={() => setDeployModal(false)} title="Deploy complete">
        {deployResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total', value: deployResult.total, color: 'var(--text)' },
                { label: 'Success', value: deployResult.success, color: 'var(--green)' },
                { label: 'Failed', value: deployResult.failed, color: deployResult.failed > 0 ? 'var(--red)' : 'var(--text-dim)' },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: 'var(--surface-2)' }}>
                  <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                </div>
              ))}
            </div>
            <Button onClick={() => setDeployModal(false)} className="w-full">Done</Button>
          </div>
        )}
      </Modal>
    </div>
  )
}

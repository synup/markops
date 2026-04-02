'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useESSignatures } from '@/hooks/useESSignatures'
import { Modal } from '@/components/email-signatures/ui/Modal'
import { Button } from '@/components/email-signatures/ui/Button'
import type { WorkspaceUser } from '@/types/email-signatures'

interface UserAssignmentModalProps {
  user: WorkspaceUser | null
  onClose: () => void
  onSaved: () => void
}

const ORG_DEFAULT_VALUE = '__org_default__'

export function UserAssignmentModal({ user, onClose, onSaved }: UserAssignmentModalProps) {
  const { signatures } = useESSignatures()
  const activeSignatures = signatures.filter(s => s.status === 'active')

  // Derive current override signature id from the joined data
  const rawAssignment = (user as unknown as Record<string, unknown>)
    ?.es_signature_assignments as Array<{ signature_id: string; es_signatures: { name: string } }> | undefined
  const currentOverrideId = user?.signature_override ? (rawAssignment?.[0]?.signature_id ?? '') : ''

  const [selectedId, setSelectedId] = useState(currentOverrideId || ORG_DEFAULT_VALUE)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sync when user changes
  useEffect(() => {
    setSelectedId(currentOverrideId || ORG_DEFAULT_VALUE)
    setError(null)
  }, [user?.id, currentOverrideId])

  if (!user) return null

  const currentLabel = user.signature_override
    ? (rawAssignment?.[0]?.es_signatures?.name ?? 'Unknown signature')
    : 'Org default'

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    const supabase = createClient()

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      const assignedBy = authUser?.email ?? 'admin'

      if (selectedId === ORG_DEFAULT_VALUE) {
        // Remove override: delete assignment + clear flag
        await supabase
          .from('es_signature_assignments')
          .delete()
          .eq('user_id', user.id)

        const { error: updateErr } = await supabase
          .from('es_workspace_users')
          .update({ signature_override: false })
          .eq('id', user.id)
        if (updateErr) throw updateErr
      } else {
        // Set override: upsert assignment + set flag
        const { error: upsertErr } = await supabase
          .from('es_signature_assignments')
          .upsert(
            { user_id: user.id, signature_id: selectedId, is_override: true, assigned_by: assignedBy },
            { onConflict: 'user_id' }
          )
        if (upsertErr) throw upsertErr

        const { error: updateErr } = await supabase
          .from('es_workspace_users')
          .update({ signature_override: true })
          .eq('id', user.id)
        if (updateErr) throw updateErr
      }

      onSaved()
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save assignment')
    } finally {
      setSaving(false)
    }
  }

  const hasChanged = selectedId !== (currentOverrideId || ORG_DEFAULT_VALUE)

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--surface-2)',
    color: 'var(--text)',
    fontSize: 14,
    outline: 'none',
  }

  return (
    <Modal open={!!user} onClose={onClose} title="Assign signature">
      {/* User info */}
      <div className="flex items-center gap-3 mb-5 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
          style={{ background: 'var(--brand-muted)', color: 'var(--brand)' }}
        >
          {(user.first_name?.[0] ?? user.email[0]).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm truncate" style={{ color: 'var(--text)' }}>
            {user.first_name} {user.last_name}
          </p>
          <p className="text-xs truncate" style={{ color: 'var(--text-dim)' }}>{user.email}</p>
          {user.job_title && (
            <p className="text-xs truncate" style={{ color: 'var(--text-dim)' }}>{user.job_title}</p>
          )}
        </div>
      </div>

      {/* Current status */}
      <div className="mb-4">
        <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Current assignment</p>
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
            style={
              user.signature_override
                ? { background: 'var(--amber-muted, #FAEEDA)', color: 'var(--amber, #854F0B)' }
                : { background: 'var(--surface-2)', color: 'var(--text-muted)' }
            }
          >
            {user.signature_override ? 'Override' : 'Org default'}
          </span>
          <span className="text-sm" style={{ color: 'var(--text)' }}>{currentLabel}</span>
        </div>
      </div>

      {/* Selector */}
      <div className="mb-5">
        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
          Assign signature
        </label>
        <select value={selectedId} onChange={e => setSelectedId(e.target.value)} style={selectStyle}>
          <option value={ORG_DEFAULT_VALUE}>Use org default</option>
          {activeSignatures.map(s => (
            <option key={s.id} value={s.id}>
              {s.name}{s.is_org_default ? ' (org default)' : ''}
            </option>
          ))}
        </select>
        {activeSignatures.length === 0 && (
          <p className="text-xs mt-1.5" style={{ color: 'var(--text-dim)' }}>
            No active signatures available. Activate a signature first.
          </p>
        )}
      </div>

      {/* Note about deploy */}
      {hasChanged && (
        <p className="text-xs mb-4" style={{ color: 'var(--text-dim)' }}>
          Changes take effect on next Deploy All. Run it from Signature Management after saving.
        </p>
      )}

      {error && (
        <p className="text-xs mb-3 text-red-500">{error}</p>
      )}

      <div className="flex gap-2 justify-end">
        <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button onClick={handleSave} loading={saving} disabled={!hasChanged}>
          Save assignment
        </Button>
      </div>
    </Modal>
  )
}

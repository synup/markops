import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ESSettings {
  auto_import_enabled: boolean
}

export function useESSettings() {
  const [settings, setSettings] = useState<ESSettings>({ auto_import_enabled: true })
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    const supabase = createClient()

    const [settingsRes, syncRes] = await Promise.all([
      supabase.from('es_settings').select('key, value'),
      supabase
        .from('es_workspace_users')
        .select('last_synced_at')
        .order('last_synced_at', { ascending: false })
        .limit(1),
    ])

    if (settingsRes.data) {
      const map = Object.fromEntries(settingsRes.data.map(r => [r.key, r.value]))
      setSettings({
        auto_import_enabled: map.auto_import_enabled !== 'false',
      })
    }

    if (syncRes.data?.[0]) {
      setLastSyncAt(syncRes.data[0].last_synced_at)
    }

    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const updateSetting = useCallback(async (key: string, value: string) => {
    const supabase = createClient()
    await supabase.from('es_settings').upsert({
      key,
      value,
      updated_at: new Date().toISOString(),
    })
    await fetch()
  }, [fetch])

  return { settings, lastSyncAt, loading, updateSetting, refetch: fetch }
}

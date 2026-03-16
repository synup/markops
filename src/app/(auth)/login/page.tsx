'use client'

import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const handleLogin = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
        queryParams: { hd: 'synup.com' },
      },
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div
        className="w-full max-w-sm rounded-xl p-8 text-center"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-lg font-extrabold text-white"
          style={{ background: 'var(--brand)' }}
        >
          M
        </div>
        <h1 className="mb-1 text-xl font-semibold" style={{ color: 'var(--text)' }}>
          Marketing HQ
        </h1>
        <p className="mb-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          Sign in with your @synup.com account
        </p>
        <button
          onClick={handleLogin}
          className="w-full cursor-pointer rounded-lg px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: 'var(--brand)' }}
        >
          Continue with Google
        </button>
        <p className="mt-4 text-xs" style={{ color: 'var(--text-dim)' }}>
          Only @synup.com emails are allowed
        </p>
      </div>
    </div>
  )
}

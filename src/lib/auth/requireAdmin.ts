import { createClient } from '@/lib/supabase/server'

/**
 * Gate an API route to admin users only.
 * Throws a Response (401 unauthorized / 403 forbidden) on failure so the
 * route handler can `catch (err) { if (err instanceof Response) return err }`.
 * Returns the cookie-aware supabase client (good for RLS-aware reads) plus
 * the authed user and profile. For writes that bypass RLS, the caller
 * should pull in `createAdminClient` from `@/lib/supabase/admin`.
 */
export async function requireAdmin() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    throw new Response(
      JSON.stringify({ error: 'Profile lookup failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
  if (!profile || profile.role !== 'admin') {
    throw new Response(
      JSON.stringify({ error: 'Forbidden: admin role required' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } },
    )
  }

  return { supabase, user, profile }
}

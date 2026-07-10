import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? ''

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    'Supabase env vars not set — run mcp__supabase__provision_database first. ' +
    'Queries will fail silently until VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are in .env.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Authorization-code flow with PKCE: the OAuth redirect back to /auth
    // carries a short-lived one-time code instead of access/refresh tokens in
    // the URL fragment. supabase-js still defaults to the implicit flow, so
    // PKCE must be opted into explicitly.
    flowType: 'pkce',
    // Let the SDK consume the ?code= callback on startup: it exchanges the
    // code for a session, persists it, and strips the code from the URL.
    // The app must never call exchangeCodeForSession itself — the code is
    // single-use and a manual exchange would race this automatic one.
    detectSessionInUrl: true,
  },
})

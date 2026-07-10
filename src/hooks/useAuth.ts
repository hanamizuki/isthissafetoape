import { useState, useEffect } from "react"
import type { AuthError, User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

/** The only sign-in providers the app exposes. */
export type OAuthProvider = "google" | "apple"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  // Error from the SDK's startup URL-code detection/exchange, surfaced for
  // the /auth callback UI (e.g. provider denial, missing/expired PKCE
  // verifier, reused code). Other pages can ignore it.
  const [initError, setInitError] = useState<AuthError | null>(null)

  useEffect(() => {
    let cancelled = false

    // initialize() is the SDK's own memoized startup (already kicked off by
    // createClient): with detectSessionInUrl it consumes a ?code= callback
    // and exchanges it for a session. Awaiting it here only observes that
    // startup and its error — it never re-runs the exchange.
    supabase.auth
      .initialize()
      .then(async ({ error }) => {
        const { data } = await supabase.auth.getUser()
        if (cancelled) return
        setUser(data.user)
        setInitError(error ?? null)
        setLoading(false)
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  // Starts the PKCE flow: the SDK stores a verifier locally and navigates to
  // the provider. The provider returns through Supabase to /auth on the same
  // origin, where the SDK exchanges the code automatically (see supabase.ts).
  const signInWithProvider = async (provider: OAuthProvider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      // Callback is always /auth on the exact origin that initiated the
      // flow — the PKCE verifier is origin-scoped, so a preview deployment
      // must return to itself, never to production.
      options: { redirectTo: `${window.location.origin}/auth` },
    })
    if (error) throw error
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return { user, loading, initError, signInWithProvider, signOut }
}

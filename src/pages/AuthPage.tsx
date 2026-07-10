import { useEffect, useState, type ReactNode } from "react"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
import { LoaderCircle } from "lucide-react"
import { useAuth, type OAuthProvider } from "@/hooks/useAuth"
import {
  isAuthStorageWritable,
  sanitizeRedirect,
  storeReturnTo,
  takeReturnTo,
} from "@/lib/authRedirect"

// /auth is both the sign-in page and the OAuth callback target: Supabase
// redirects back here with a one-time ?code= that the SDK exchanges
// automatically during client initialization (see src/lib/supabase.ts).
// This page only observes the outcome and renders the right state — it
// never exchanges the code itself.

// Supabase returns PKCE results to /auth as query parameters; provider
// errors can also arrive in the hash fragment. Read both.
function readAuthParams() {
  const query = new URLSearchParams(window.location.search)
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""))
  const pick = (key: string) => query.get(key) ?? hash.get(key)
  return {
    code: pick("code"),
    error: pick("error"),
    errorDescription: pick("error_description"),
  }
}

// Drop consumed callback parameters (code / error) from the address bar
// without navigating, preserving the router's history state.
function clearAuthParamsFromUrl() {
  window.history.replaceState(window.history.state, "", window.location.pathname)
}

type UiState =
  | { kind: "idle" }
  | { kind: "redirecting"; provider: OAuthProvider }
  | { kind: "error"; message: string }

function AuthPage() {
  const { user, loading, initError, signInWithProvider } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [ui, setUi] = useState<UiState>({ kind: "idle" })
  // Mount-time snapshot: did this page load start as an OAuth callback?
  // Display-only ("Completing sign-in…") — failure detection re-reads the
  // live URL below, because the SDK strips the code on success.
  const [wasCallback] = useState(() => readAuthParams().code !== null)

  // Visiting /auth fresh — no callback params and no ?redirect= — starts a
  // NEW sign-in intent: discard any stale destination left by an earlier
  // abandoned attempt, so e.g. the home-page sign-in link doesn't land on an
  // old report. The retry path is unaffected: a cancel callback arrives WITH
  // params, and TRY AGAIN reuses this mounted page. Declared before the
  // navigate effect below so an already-signed-in visit can't consume the
  // stale value first.
  useEffect(() => {
    const params = readAuthParams()
    const hasRedirect = new URLSearchParams(window.location.search).has("redirect")
    if (!params.code && !params.error && !hasRedirect) takeReturnTo()
  }, [])

  // Signed in — via a fresh callback exchange or an existing session:
  // consume the stored destination and leave, replacing /auth in history.
  // Destinations are re-validated on the way out; anything invalid → "/".
  useEffect(() => {
    if (loading || !user) return
    const origin = window.location.origin
    // takeReturnTo() clears the stored key — one call per navigation decision.
    const dest =
      sanitizeRedirect(takeReturnTo(), origin) ??
      sanitizeRedirect(searchParams.get("redirect"), origin) ??
      "/"
    navigate(dest, { replace: true })
  }, [loading, user, navigate, searchParams])

  // Initialization finished without a session: classify the failure, show a
  // finite error state (never an indefinite spinner), and clean the URL so
  // a retry starts from a fresh /auth.
  useEffect(() => {
    if (loading || user) return
    const live = readAuthParams()
    if (live.error) {
      // One static message for every provider error. error_description is
      // attacker-influenceable (anyone can craft /auth?error=...&error_
      // description=... links), so it must never be rendered inside the
      // trusted alert — that would be a reflected-phishing vector.
      console.warn("OAuth provider error:", live.error, live.errorDescription)
      setUi({
        kind: "error",
        message:
          "Sign-in was cancelled or the provider returned an error. Please try again.",
      })
      clearAuthParamsFromUrl()
    } else if (live.code) {
      // A code survived initialization with no session: the PKCE verifier
      // is missing, expired, overwritten by another tab, or the code was
      // already used. Codes are single-use — only a fresh sign-in recovers.
      setUi({
        kind: "error",
        message:
          "Sign-in could not be completed — the attempt may have expired or already been used. Please start again.",
      })
      clearAuthParamsFromUrl()
    } else if (initError) {
      setUi({ kind: "error", message: initError.message })
    }
  }, [loading, user, initError])

  // Pressing Back from the provider's page can restore this one from the
  // back-forward cache with React state intact — ui stuck on "redirecting"
  // and both buttons disabled. Reset transient state on a bfcache restore.
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setUi({ kind: "idle" })
    }
    window.addEventListener("pageshow", onPageShow)
    return () => window.removeEventListener("pageshow", onPageShow)
  }, [])

  const startSignIn = async (provider: OAuthProvider) => {
    // The PKCE verifier (localStorage) and the return path (sessionStorage)
    // must survive the round-trip to the provider — verify before leaving.
    if (!isAuthStorageWritable()) {
      setUi({
        kind: "error",
        message:
          "Your browser is blocking site storage, which sign-in needs. Allow site data (or leave private browsing) and try again.",
      })
      return
    }
    // A null destination is not stored and does not clear an earlier one —
    // a cancel-then-retry has no ?redirect= and must keep the destination
    // from the first attempt (see storeReturnTo).
    storeReturnTo(sanitizeRedirect(searchParams.get("redirect"), window.location.origin))
    setUi({ kind: "redirecting", provider })
    try {
      await signInWithProvider(provider)
      // The browser is now navigating away to the provider.
    } catch (err) {
      setUi({
        kind: "error",
        message:
          err instanceof Error ? err.message : "Could not start sign-in. Please try again.",
      })
    }
  }

  let body: ReactNode
  if (ui.kind === "error") {
    body = (
      <div className="space-y-4 text-center">
        <p role="alert" className="text-sm text-red-400">
          {ui.message}
        </p>
        <button
          onClick={() => setUi({ kind: "idle" })}
          className="w-full h-11 bg-cyan-500 hover:bg-cyan-400 text-background font-pixel font-bold text-sm rounded-none shadow-[0_0_15px_rgba(34,211,238,0.4)] hover:shadow-[0_0_25px_rgba(34,211,238,0.6)] transition-all"
        >
          TRY AGAIN
        </button>
      </div>
    )
  } else if (loading) {
    body = <Pending label={wasCallback ? "Completing sign-in…" : "Checking session…"} />
  } else if (user) {
    body = <Pending label="Redirecting…" />
  } else {
    const redirecting = ui.kind === "redirecting"
    body = (
      <div className="space-y-3">
        <ProviderButton
          provider="google"
          label="Continue with Google"
          pending={redirecting && ui.provider === "google"}
          disabled={redirecting}
          onClick={() => startSignIn("google")}
        />
        <ProviderButton
          provider="apple"
          label="Continue with Apple"
          pending={redirecting && ui.provider === "apple"}
          disabled={redirecting}
          onClick={() => startSignIn("apple")}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden scanlines">
      <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full bg-cyan-500/8 blur-[120px] pointer-events-none" />

      <main id="main-content" className="w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <img
              src="/shield-logo.png"
              alt=""
              className="h-10 w-10 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]"
            />
          </Link>
          <h1 className="font-pixel text-xl text-cyan-400 neon-text-cyan mt-4">Sign In</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Continue with Google or Apple to keep scanning
          </p>
        </div>

        <div className="border-2 border-cyan-400/15 bg-card/50 p-6 neon-box-cyan">{body}</div>
      </main>
    </div>
  )
}

function Pending({ label }: { label: string }) {
  return (
    <div role="status" className="flex flex-col items-center gap-3 py-4">
      <LoaderCircle className="h-6 w-6 animate-spin text-cyan-400" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

// Provider buttons follow the providers' branding rules: official logos,
// permitted labels, and provider-approved colors (the "light"/white scheme
// for both). The surrounding page keeps the neon style, but these buttons
// are deliberately not recolored into the product palette.
function ProviderButton({
  provider,
  label,
  pending,
  disabled,
  onClick,
}: {
  provider: OAuthProvider
  label: string
  pending: boolean
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full h-11 flex items-center justify-center gap-3 bg-white text-sm font-medium rounded-none transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed ${
        provider === "google" ? "text-[#1f1f1f]" : "text-black"
      }`}
    >
      {pending ? (
        <LoaderCircle className="h-5 w-5 animate-spin" />
      ) : provider === "google" ? (
        <GoogleLogo />
      ) : (
        <AppleLogo />
      )}
      {pending ? "Redirecting…" : label}
    </button>
  )
}

// Official Google "G" mark (branding guidelines require the four-color logo
// on a white button).
function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  )
}

// Official Apple logo mark, solid black per the white-button style.
function AppleLogo() {
  return (
    <svg viewBox="0 0 814 1000" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z" />
    </svg>
  )
}

export default AuthPage

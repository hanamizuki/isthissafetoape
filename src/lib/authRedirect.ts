// Post-authentication destination handling for the /auth page.
//
// The destination a user came from ("return to /history after sign-in") is
// application-owned state kept in sessionStorage under RETURN_TO_KEY. It is
// deliberately separate from the SDK's localStorage-backed auth storage,
// which holds the PKCE verifier and the session — the two must never share
// keys or storage areas.

// Module-private: all access goes through storeReturnTo/takeReturnTo below.
const RETURN_TO_KEY = "itsta:auth-return-to"

/**
 * Validate a requested post-login destination as a same-origin application
 * path. Returns the normalized internal path, or null when the value is
 * missing, external, protocol-relative, or malformed — callers fall back to
 * "/". This is the open-redirect guard for the auth flow: everything read
 * from the ?redirect= query or from sessionStorage goes through here.
 */
export function sanitizeRedirect(
  raw: string | null | undefined,
  origin: string
): string | null {
  // Internal paths start with exactly one "/": rejects absolute URLs
  // ("https://evil.com") and protocol-relative ones ("//evil.com").
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null
  let url: URL
  try {
    url = new URL(raw, origin)
  } catch {
    return null
  }
  // Backslash tricks ("/\evil.com") normalize to another origin here.
  if (url.origin !== origin) return null
  // Dot-segments collapse during URL normalization, so an internal-looking
  // input can come out protocol-relative ("/..//evil.com" → "//evil.com").
  // The leading-"//" check above ran on the RAW string; re-check the
  // NORMALIZED path before handing it back.
  const path = url.pathname + url.search + url.hash
  if (path.startsWith("//")) return null
  return path
}

/**
 * Remember the post-login destination across the round-trip to the provider.
 * A null destination is deliberately a no-op rather than a removal: a
 * cancel-then-retry lands back on /auth with no ?redirect= and must not wipe
 * the destination stored by the first attempt.
 */
export function storeReturnTo(dest: string | null) {
  try {
    if (dest) window.sessionStorage.setItem(RETURN_TO_KEY, dest)
  } catch {
    // storage was probed writable before sign-in (isAuthStorageWritable);
    // on a late failure the destination just falls back to "/"
  }
}

/**
 * Read and clear the stored destination — single-use, so call it once per
 * navigation decision. sessionStorage can throw when the browser blocks
 * site data entirely; treat that as "no stored destination".
 */
export function takeReturnTo(): string | null {
  try {
    const value = window.sessionStorage.getItem(RETURN_TO_KEY)
    window.sessionStorage.removeItem(RETURN_TO_KEY)
    return value
  } catch {
    return null
  }
}

/**
 * Sign-in requires writable browser storage on the initiating page:
 * localStorage for the SDK's PKCE verifier and session, sessionStorage for
 * the return-to path. Probed before leaving for the provider so the user
 * gets an explanation instead of a broken callback.
 */
export function isAuthStorageWritable(): boolean {
  const probe = "itsta:storage-probe"
  try {
    window.localStorage.setItem(probe, "1")
    window.localStorage.removeItem(probe)
    window.sessionStorage.setItem(probe, "1")
    window.sessionStorage.removeItem(probe)
    return true
  } catch {
    return false
  }
}

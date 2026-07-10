# Google and Apple OAuth Authentication

Status: approved for implementation

Scope: replace the public email-and-password authentication flow with Google and Apple social login through Supabase Auth, using the OAuth authorization code flow with PKCE.

## 1. Goals

- Present Google and Apple as the only sign-in choices in the application UI.
- Use PKCE so the application redirect carries a short-lived authorization code instead of Supabase access and refresh tokens.
- Return users to the internal page that originally required authentication.
- Preserve existing Supabase user IDs and user-owned data when Supabase can safely link an OAuth identity by verified email.
- Give users a clear recovery path when the provider is cancelled, the authorization code cannot be exchanged, or browser storage is unavailable.
- Keep provider secrets, Apple signing material, and generated Apple client secrets out of the frontend and the repository.

## 2. Non-goals

- Server-side rendering, cookie-based sessions, or a backend authentication callback.
- Manual account-linking UI or an account-management page.
- Migrating or merging users whose provider email differs from their existing Supabase email.
- Collecting a display name from Apple.
- Revoking already-issued sessions solely because the email provider is disabled.
- Database migrations or changes to RLS policies. Authorization continues to depend on the Supabase user ID, not the login provider.

## 3. Authentication Architecture

### Providers

Google and Apple are the only providers exposed by the application. Email-and-password controls, registration mode, and related success messages are removed from the authentication page.

The Supabase Email provider remains enabled only during provider setup and production verification. It is disabled after both OAuth providers pass the production smoke test. Disabling it blocks new email/password and magic-link authentication but does not delete users or revoke existing sessions.

### OAuth flow

The browser client uses the authorization code flow with PKCE. The single Supabase client remains initialized at module scope and is configured to detect authentication responses in the URL. The SDK owns verifier generation, verifier storage, authorization-code exchange, session persistence, and removal of a successfully exchanged code from the URL.

The application does not manually exchange the authorization code. A manual exchange would race with the SDK's automatic initialization, and a code can only be used once.

The resulting Supabase session remains stored by the browser client in local storage. PKCE protects the redirect and code-exchange stage; it does not protect a stored session from same-origin XSS, malicious extensions, or a compromised device.

### Redirect flow

1. A user reaches `/auth`, optionally with an internal destination supplied by the report, history, or subscription UI.
2. The authentication page validates the destination as a same-origin application path and stores it in application-owned session storage as temporary post-authentication state. Invalid, external, protocol-relative, or malformed destinations fall back to `/`.
3. The application starts Google or Apple OAuth with an application return URL fixed to `/auth` on the exact origin that initiated the flow.
4. Google or Apple returns to the Supabase provider callback at `https://rhqkbkckmukjhgunrclo.supabase.co/auth/v1/callback`.
5. Supabase returns the browser to the initiating origin's `/auth` route with a short-lived authorization code.
6. The Supabase browser client exchanges the code automatically, persists the session, and notifies existing auth-state subscribers.
7. The authentication page consumes the validated post-authentication destination and navigates there with history replacement. If no destination exists, it navigates to `/`.

The SDK's PKCE verifier remains in its default local-storage-backed auth storage. Temporary application navigation state remains in session storage; it is separate and must never replace or modify the SDK verifier.

The existing `/auth` route is both the sign-in page and the application callback page. No new React route or server callback is required. Vercel's existing SPA rewrite continues to serve the application for direct route loads.

### Callback states and recovery

The authentication page distinguishes these states:

- Idle: show the two provider buttons.
- Redirecting: disable both buttons after the first provider is selected.
- Completing: an authorization code is present and the Supabase client is still initializing.
- Provider rejection or cancellation: show a concise error and a retry action, then remove provider error parameters from the address bar.
- Exchange failure: if initialization finishes with a code still present and no session, treat the verifier as missing, expired, overwritten, or unusable; clear authentication parameters and ask the user to restart sign-in.
- Storage unavailable: before leaving the application, verify that persistent browser storage is writable. If it is not, explain that sign-in must be retried in a browser mode that permits site storage.

Initialization and callback errors must not leave the page on an indefinite loading state. A retry always starts a fresh provider flow.

## 4. Frontend Responsibilities

| File | Responsibility |
|---|---|
| `src/lib/supabase.ts` | Opt the singleton browser client into PKCE and URL session detection. Keep the publishable key as the only browser key. |
| `src/hooks/useAuth.ts` | Replace email/password sign-in and sign-up with provider sign-in; retain user loading, auth-state subscription, and sign-out; surface initialization errors needed by the callback UI. |
| `src/pages/AuthPage.tsx` | Render compliant Google and Apple buttons; validate and retain the internal destination; manage redirect, callback, success, and retry states. |
| `src/App.tsx` | No authentication-specific change. The existing `/auth` route remains the callback destination. |
| `docs/spec/related-protocols-and-alerts.md` | Update the shipped subscription login description when the OAuth implementation is delivered. |
| `README.md` | Add provider setup, redirect configuration, Apple relay, and Apple secret-rotation operations when the implementation is delivered. |

Provider buttons use official provider artwork, permitted labels, and provider-compliant colors. The surrounding card and page may retain the existing neon visual language, but the provider logos and buttons are not recolored into the product palette.

## 5. Supabase URL Configuration

The required production Site URL is:

- `https://isthissafetoape.com`

The redirect allow list contains exact callback paths for active environments:

- `http://localhost:3000/auth`
- `http://127.0.0.1:3000/auth` when local testing uses the loopback IP
- `https://isthissafetoape.com/auth`

A Vercel preview pattern is added only when OAuth must be tested on preview deployments. The pattern is restricted to this project's account and `/auth` path. Every environment returns to the origin that initiated sign-in; preview sign-in must not return to production because the PKCE verifier is origin-scoped.

The Supabase provider callback and the application callback are different endpoints:

- Provider callback: Google or Apple returns to Supabase at `/auth/v1/callback` on the Supabase project domain.
- Application callback: Supabase returns to `/auth` on the initiating application origin.

## 6. Google Provider Configuration

- Create a Google OAuth client of type Web application.
- Add `https://isthissafetoape.com` and the active local origin as Authorized JavaScript origins.
- Add `https://rhqkbkckmukjhgunrclo.supabase.co/auth/v1/callback` as the Authorized redirect URI, using the exact callback shown by the Supabase Google provider page if it differs.
- Configure the Google Auth Platform audience, test users, and production status deliberately.
- Configure only the login scopes required by Supabase: OpenID, email, and profile.
- Configure app branding and support information before public release.
- Store the Google client secret only in Google and Supabase provider configuration.

## 7. Apple Provider Configuration

- Use an active Apple Developer account with a primary App ID that has Sign in with Apple enabled.
- Create a Services ID linked to that primary App ID.
- Configure the Services ID website domain as `rhqkbkckmukjhgunrclo.supabase.co` and its return URL as `https://rhqkbkckmukjhgunrclo.supabase.co/auth/v1/callback`, unless the Supabase provider page displays a custom-domain callback.
- Create and securely retain a Sign in with Apple private key. The `.p8` file is downloaded once and is never committed or uploaded to the frontend.
- Generate the Apple OAuth client secret from the Services ID, Team ID, Key ID, and `.p8` signing key. Supabase receives the Services ID and generated client secret, not the raw `.p8` file.
- Replace the generated Apple client secret before its maximum six-month expiry. Operationally, schedule rotation every five months and verify Apple login immediately after replacement.
- Register `isthissafetoape.com` or the exact sender `alerts@isthissafetoape.com` for Sign in with Apple Email Communication, and verify the sender with SPF and DKIM. This is required for alert delivery to users who choose Hide My Email.
- Leave Apple's server-to-server notification endpoint unset because the selected Supabase flow does not support it.

Apple OAuth does not provide a reliable full name. The product does not depend on a user name. Alert subscriptions do depend on `auth.users.email`, so accounts without an email are not supported.

## 8. Identity and Existing Users

Supabase automatically links an OAuth identity when the provider returns the same verified email as an existing user. A successful automatic link preserves the Supabase user ID and therefore preserves scans, subscriptions, and notification ownership.

Apple Hide My Email produces a relay address that differs from the user's existing address. It does not automatically link to an existing email identity and can create a second Supabase user. This implementation does not merge those accounts.

Before disabling the Email provider, inspect the existing Auth users and identify accounts that own scans or subscriptions. Each active user must have a viable Google or Apple sign-in path, or an explicit migration decision, before the old provider is removed.

Existing valid sessions continue to load after the client switches to PKCE. An implicit login already in flight when the PKCE build is deployed may return an incompatible response and require one clean retry; no user-data migration is required.

## 9. Rollout Order

1. Inventory existing Auth users, identities, scans, and subscriptions.
2. Correct the Supabase Site URL and add exact application callback URLs.
3. Configure Google, Apple, Apple secret rotation, and Apple Private Email Relay while Email authentication remains enabled.
4. Verify both providers locally and, if needed, on a same-origin Vercel preview.
5. Deploy the PKCE client and OAuth-only authentication page.
6. Smoke-test Google and Apple on the production domain, including post-authentication navigation.
7. Send a real alert to an Apple private relay address and confirm delivery.
8. Disable the Supabase Email provider.
9. Verify that email/password and magic-link authentication are rejected while Google and Apple remain functional.

If either provider fails before step 8, keep Email enabled and correct the provider configuration. If a provider fails after step 8, re-enable Email only as an operational rollback while the OAuth issue is corrected.

## 10. Acceptance Criteria

### Functional

- The authentication page exposes only Google and Apple sign-in.
- Google and Apple each create or restore a Supabase session, survive a page reload, and sign out normally.
- Authentication started from history, a report with nested query parameters, or a subscription action returns to the complete original internal location.
- A malformed or external destination never causes an external post-authentication redirect.
- Provider cancellation, rejection, code exchange failure, and unavailable browser storage each produce a finite, understandable retry state.
- A successful callback removes the authorization code from the visible URL.

### Security and configuration

- New OAuth requests use PKCE and successful application callbacks contain a code rather than Supabase access or refresh tokens.
- The production redirect allow list uses the exact `/auth` callback path.
- No service-role key, Google client secret, Apple `.p8` key, or Apple client secret is present in frontend assets, repository files, logs, or PR text.
- The Email provider is disabled only after both production OAuth flows pass.
- Existing authorization continues to use `auth.uid()` and the stable Supabase user ID.

### Compatibility and operations

- An existing valid implicit session remains authenticated after the PKCE build is loaded.
- A same-email Google identity links to the intended existing user and preserves its user ID and owned data.
- Apple Share My Email and Hide My Email are both tested; an alert reaches the relay address in the latter case.
- Localhost, production, and any explicitly supported preview origin each return to the same origin that initiated sign-in.
- Two simultaneous OAuth attempts may invalidate one another, but both pages recover through a clear fresh-login action instead of an infinite loading state.
- The frontend passes `bun run build`.

## 11. Known Limitations and Operations

- PKCE completion requires the same browser, device, and origin that initiated the flow. Moving the callback to another browser or clearing site storage requires restarting sign-in.
- The SDK uses one verifier entry per Supabase client storage key. Concurrent OAuth attempts in different tabs can overwrite one another.
- The browser session remains in local storage after exchange. PKCE does not replace CSP, XSS prevention, dependency hygiene, or RLS.
- Apple client-secret rotation is a recurring production operation. Missing the rotation deadline disables Apple login.
- Apple relay delivery depends on continuing SPF/DKIM validity and the registered sender source.
- Users whose OAuth identity does not match an existing verified email may receive a new Supabase user ID; manual merging is outside this scope.

## 12. References

- [Supabase PKCE flow](https://supabase.com/docs/guides/auth/sessions/pkce-flow)
- [Supabase implicit flow](https://supabase.com/docs/guides/auth/sessions/implicit-flow)
- [Supabase redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- [Supabase Google login](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Supabase Apple login](https://supabase.com/docs/guides/auth/social-login/auth-apple)
- [Supabase identity linking](https://supabase.com/docs/guides/auth/auth-identity-linking)
- [OAuth 2.0 Security Best Current Practice](https://www.rfc-editor.org/rfc/rfc9700.html)
- [Apple Private Email Relay](https://developer.apple.com/help/account/capabilities/configure-private-email-relay-service/)
- [Google sign-in branding](https://developers.google.com/identity/branding-guidelines)
- [Sign in with Apple design guidance](https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple)

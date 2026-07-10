# IsThisSafeToApe

AI-powered risk assessment for DeFi projects. Paste a URL, get a detailed safety report.

## What It Does

Enter any DeFi project, airdrop, or crypto protocol URL. The AI fetches the target page and searches third-party sources, then analyzes everything across 6 dimensions and returns a scored risk report (0–100):

- **Smart Contract & Security** — audit status, code quality, centralization risks
- **Economic & Financial** — tokenomics, liquidity, yield sustainability
- **Governance & Transparency** — on-chain reserves, team doxxing, community governance
- **Project Fundamentals** — team background, milestones, compliance
- **Market & Operations** — market position, growth, partner dependencies
- **Infrastructure Risk** — oracle, bridge, MEV, frontend security

Red flag rules automatically cap scores (e.g., no audit → max 60, anonymous team + no multisig → max 50).

## Features

- **Web research** — fetches the target site via [Jina Reader](https://jina.ai/reader/) and searches external sources via [Brave Search API](https://brave.com/search/api/) before analysis
- **Deep dive prompt** — generates a copyable prompt from the report so you can hand it to your own AI agent for deeper investigation, with dynamic suggestions based on weak scoring categories
- **Related protocols** — each report maps the project's DeFi supply-chain dependencies (lending markets, stablecoin issuers, oracles, bridges), because a failure anywhere upstream endangers your funds. Official links are resolved from a trusted source ([DeFiLlama](https://defillama.com/), CoinGecko fallback) — never from the LLM, since a hallucinated URL is a phishing vector — and each dependency has a one-click re-scan
- Cyberpunk/retro pixel-art UI with neon glow effects
- Shareable report links (`/report/:id`)
- 24-hour scan caching per hostname
- Anonymous usage (3 scans/day) or sign in with Google / Apple for unlimited
- IP-based rate limiting with SHA-256 hashed fingerprints

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **UI Components**: shadcn/ui (Radix primitives)
- **Backend**: Supabase Edge Functions (Deno)
- **AI**: OpenRouter (primary: `inclusionai/ring-2.6-1t:free`, fallbacks: `anthropic/claude-haiku-4.5`, `google/gemini-2.5-flash`) via OpenAI-compatible SDK, with web research (Jina Reader + Brave Search)
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel (frontend) + Supabase (backend)

## Getting Started

```bash
# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
# Fill in:
#   VITE_SUPABASE_URL=
#   VITE_SUPABASE_PUBLISHABLE_KEY=

# Start dev server
bun run dev
```

### Supabase Setup

1. Create a Supabase project
2. Run the migrations in `supabase/migrations/` in order
3. Deploy the edge functions. `refresh-protocols`, `ingest-posts`, `unsubscribe`, and `notify`
   each authenticate themselves (a shared-secret header, or — for `unsubscribe` — an HMAC
   signature carried in the link), so deploy them with JWT verification off:
   ```bash
   supabase functions deploy analyze
   supabase functions deploy refresh-protocols --no-verify-jwt
   supabase functions deploy ingest-posts --no-verify-jwt
   supabase functions deploy unsubscribe --no-verify-jwt
   supabase functions deploy notify --no-verify-jwt
   ```
4. Set edge function secrets:
   ```bash
   supabase secrets set OPENROUTER_API_KEY=sk-or-...
   supabase secrets set JINA_API_KEY=jina_...
   supabase secrets set BRAVE_SEARCH_API_KEY=...
   supabase secrets set REFRESH_SECRET=$(openssl rand -hex 32)   # gates refresh-protocols
   supabase secrets set INGEST_API_KEY=$(openssl rand -hex 32)   # gates ingest-posts; share with the scraper
   supabase secrets set HMAC_SECRET=$(openssl rand -hex 32)      # signs unsubscribe links
   supabase secrets set NOTIFY_SECRET=$(openssl rand -hex 32)    # gates notify pipeline
   supabase secrets set PLUNK_SECRET_KEY=...                     # Plunk API key for alert emails
   supabase secrets set PLUNK_BASE_URL=https://api.plunk.hanamizuki.tw  # self-hosted Plunk instance
   ```
5. Populate and schedule the protocol directory (backs the related-protocols feature).
   `refresh-protocols` is gated on `REFRESH_SECRET` sent as the `x-refresh-key` header, so
   only the cron (or an operator) can trigger the multi-MB DeFiLlama fetch + upsert:
   ```bash
   # First population — call once with the shared secret:
   curl -X POST 'https://<ref>.supabase.co/functions/v1/refresh-protocols' \
     -H "x-refresh-key: <REFRESH_SECRET>"
   ```
   ```sql
   -- Daily refresh via Supabase Cron (pg_cron + pg_net). Run in the SQL Editor:
   select vault.create_secret('<REFRESH_SECRET>', 'refresh_secret');
   select cron.schedule('refresh-protocols-daily', '0 3 * * *', $$
     select net.http_post(
       url     := 'https://<ref>.supabase.co/functions/v1/refresh-protocols',
       headers := jsonb_build_object(
         'x-refresh-key', (select decrypted_secret from vault.decrypted_secrets where name = 'refresh_secret'),
         'Content-Type', 'application/json')
     ) $$);
   ```
6. Security-alert ingestion (`ingest-posts` + `security_posts`): an external X scraper POSTs
   batches of posts, gated on `INGEST_API_KEY` via the `x-ingest-key` header. Idempotent —
   re-sending a batch is safe (upsert does nothing on `post_url` conflict):
   ```bash
   curl -X POST 'https://<ref>.supabase.co/functions/v1/ingest-posts' \
     -H "x-ingest-key: <INGEST_API_KEY>" -H 'Content-Type: application/json' \
     -d '{"posts":[{"post_url":"...","source_account":"...","author":"...","post_type":"original","text":"...","created_at":"2026-07-08T00:00:00Z","quoted_url":null}]}'
   # → {"inserted": N, "skipped": M}
   ```
7. Alert pipeline (`notify`): scans unprocessed posts hourly, matches against subscribed
   protocols (keyword prefilter + LLM precision check), and emails subscribers via Plunk.
   Gated on `NOTIFY_SECRET` via the `x-notify-key` header:
   ```bash
   # Manual trigger:
   curl -X POST 'https://<ref>.supabase.co/functions/v1/notify' \
     -H "x-notify-key: <NOTIFY_SECRET>"
   ```
   ```sql
   -- Hourly schedule via Supabase Cron (pg_cron + pg_net). Run in the SQL Editor:
   select vault.create_secret('<NOTIFY_SECRET>', 'notify_secret');
   select cron.schedule('notify-hourly', '15 * * * *', $$
     select net.http_post(
       url     := 'https://<ref>.supabase.co/functions/v1/notify',
       headers := jsonb_build_object(
         'x-notify-key', (select decrypted_secret from vault.decrypted_secrets where name = 'notify_secret'),
         'Content-Type', 'application/json')
     ) $$);
   ```

### Authentication (Google & Apple OAuth)

Sign-in is Google / Apple OAuth only, using the authorization code flow with
PKCE (the browser client opts in via `flowType: 'pkce'` in `src/lib/supabase.ts`).
Architecture, rollout order, and acceptance criteria live in
`docs/spec/oauth-authentication.md`.

**Supabase URL configuration** (Dashboard → Authentication → URL Configuration):

- Site URL: `https://isthissafetoape.com`
- Redirect allow list — exact paths; the app always returns to `/auth` on the
  origin that initiated sign-in:
  - `https://isthissafetoape.com/auth`
  - `http://localhost:3000/auth` (plus `http://127.0.0.1:3000/auth` when testing
    via the loopback IP)

**Google** (Google Cloud Console → Credentials):

1. Create an OAuth client of type Web application. Authorized JavaScript
   origins: `https://isthissafetoape.com` and the active local origin.
2. Authorized redirect URI: the callback shown on Supabase's Google provider
   page (`https://<ref>.supabase.co/auth/v1/callback`).
3. Scopes: only `openid`, `email`, `profile`. Configure the OAuth audience and
   app branding before public release.
4. Paste the Client ID and secret into Supabase → Authentication → Providers →
   Google. The secret lives only in Google and Supabase, never in the frontend.

**Apple** (Apple Developer → Certificates, Identifiers & Profiles):

1. On an App ID with Sign in with Apple enabled, create a Services ID. Set its
   website domain and return URL to the exact values shown on Supabase's Apple
   provider page (`<ref>.supabase.co` / `https://<ref>.supabase.co/auth/v1/callback`).
2. Create a Sign in with Apple private key. The `.p8` downloads once — store it
   securely, never commit it or ship it to the frontend.
3. Generate the client-secret JWT from the Services ID, Team ID, Key ID, and
   `.p8`. Supabase receives the Services ID and that generated secret, not the
   raw `.p8`.
4. **Secret rotation**: Apple client secrets expire after at most six months.
   Rotate every five months and verify Apple login immediately after replacing
   the secret — a missed rotation silently disables Apple sign-in.
5. **Hide My Email relay**: register `isthissafetoape.com` (or the exact sender
   `alerts@isthissafetoape.com`) under Sign in with Apple → Email Communication,
   and keep SPF/DKIM valid. Without this, alert emails to users who chose
   Hide My Email bounce at Apple's private relay.

The Supabase Email provider stays enabled until both OAuth providers pass a
production smoke test; disabling it afterwards is a manual dashboard step (see
the rollout order in the spec).

## License

MIT

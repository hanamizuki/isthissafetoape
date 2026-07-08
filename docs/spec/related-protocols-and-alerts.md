# Related Protocols & Security Alerts

Status: implemented (PRs 1-4 shipped)
Scope: two features — (1) supply-chain "related protocols" on risk reports, (2) per-protocol security alert subscriptions with email notifications fed by an external X (Twitter) scraper.

## 1. Feature: Related Protocols on Reports

When a user analyzes a URL (e.g. an Aave USDT pool), the report also lists the protocols that target depends on (Aave, Tether, …), because a failure anywhere in the DeFi supply chain endangers the user's funds.

### Extraction

- The existing `analyze` edge function's system prompt gains one output field: `relatedProtocols: [{name, relationship}]`.
- The LLM lists direct and known indirect dependencies in one pass (no recursion). The main analysis remains focused on the primary protocol.
- The LLM provides **names only**. Websites are never taken from the LLM — a hallucinated URL in a security product is a phishing vector.

### Verification (name → official website)

For each extracted name, the function resolves official metadata from the `protocol_directory` table:

1. Case-insensitive exact name match.
2. Else prefix match (LLM says "Aave", directory has "Aave V3" / "AAVE V2") — pick the highest-TVL row.
3. Else CoinGecko fallback: `/search` then `/coins/{id}` for the homepage (free tier, strict rate limits, tolerate failure).
4. Else keep the name with no link.

The primary protocol itself goes through the same resolution so it can be subscribed to (Feature 2).

Enriched entries `{name, relationship, website?, category?, slug?}` are merged into `report_json`; the existing 24-hour cache applies unchanged. Old cached reports lack the field — the frontend hides the section when absent.

### protocol_directory table

| column | notes |
|---|---|
| slug | primary key, from DeFiLlama |
| name, url, category, twitter, gecko_id, tvl | subset of DeFiLlama `/protocols` (7,796 entries, free, no key) |
| updated_at | refresh timestamp |

A small `refresh-protocols` edge function pulls the full DeFiLlama list and upserts it. Scheduled daily via Supabase Cron. This keeps the multi-MB fetch out of the hot analyze path.

### UI (ReportPage)

A RELATED PROTOCOLS section above the Deep Dive block. Each row: name, relationship, category badge, official-site link, an ANALYZE button linking to `/report?url=<website>` (reusing the whole existing flow, cache and rate limits included), and a subscribe bell. The primary protocol's header also gets a bell.

## 2. Feature: Subscriptions

- Login required (email comes from `auth.users`). Anonymous users clicking the bell are routed to `/auth`.
- `subscriptions` table: id, user_id (FK auth.users), protocol_slug, protocol_name, created_at; unique (user_id, protocol_slug). RLS: users select/insert/delete only their own rows.
- Subscription key: the DeFiLlama slug when resolution found one; otherwise the lowercased protocol name (covers CoinGecko-only and unresolved protocols — keyword matching in the notify pipeline uses name and twitter handle anyway, so a missing slug only loses the directory join, not the alert).
- No subscription management page in MVP — the report-page bell toggles, and every email contains an unsubscribe link.
- Unsubscribe: a public edge function endpoint accepting a subscription id plus an HMAC signature (server secret `HMAC_SECRET`). GET renders a confirmation page with no side effect — email security scanners and link prefetchers issue automated GETs, so the delete must not fire on GET; the confirmation button POSTs back and only then is the subscription deleted (service role, no login). An invalid signature renders an error page. Canonical signature (PR 4's email link builder must reproduce it exactly): `sig = lowercase-hex(HMAC-SHA256(key = HMAC_SECRET, message = utf8(decimal-string(id))))`, no expiry — an unsubscribe link stays valid for the life of the email it was sent in.

## 3. Feature: Post Ingest (interface to the external scraper)

An external scraper (nana's `x-crypto-alerts` task, separate session/machine) collects posts hourly from 12 vetted security accounts (PeckShieldAlert, CertiKAlert, Phalcon_xyz, SlowMist_Team, TokenSniffer, De_FiSecurity, officer_secret, RugDocIO, MevRefund, lookonchain, OnchainLens, zachxbt) and POSTs new ones to this project. The scraper never holds a service-role key; it holds a single-purpose ingest key.

### security_posts table

| column | notes |
|---|---|
| id | identity primary key |
| post_url | unique — dedup key, aligned with the scraper's primary key; also the "view original" link |
| source_account | which watched account's timeline surfaced the post (trust source) |
| author | content author (retweets: the original author) |
| post_type | original / reply / retweet / quote |
| content | post text; for quotes the scraper appends the quoted text ("[quoted] …") so keyword matching sees the inner layer |
| quoted_url | nullable, quotes only |
| posted_at | original post time |
| received_at | ingest time |
| processed_at | set by the notify pipeline |

### ingest-posts edge function

- POST, batch body `{posts: [...]}` with the scraper's original field names (`post_url, source_account, author, post_type, text, created_at, quoted_url`); unknown extra fields are ignored.
- Auth: gated solely on `x-ingest-key: <INGEST_API_KEY>` (random 64-hex generated by us, shared with the scraper), deployed `--no-verify-jwt`. A dedicated secret is deterministic — it avoids depending on which key format the platform injects — and lets the scraper authenticate with one key, no anon key needed (matching `refresh-protocols`).
- Upsert on post_url conflict → do nothing. Response `{inserted, skipped}`. Re-sending a batch is safe (scraper retries by design); a malformed row is skipped without failing the batch.

## 4. Feature: Notify Pipeline

A `notify` edge function scheduled hourly via Supabase Cron:

1. Load posts where `processed_at` is null.
2. **Freshness guard**: posts older than 24h (`posted_at`) are marked processed without notifying — prevents alert floods from the scraper's first backfill (~40 posts × 12 accounts) and from pipeline downtime recovery.
3. Build the keyword set from subscribed protocols only: name + slug + twitter handle (from `subscriptions` joined to `protocol_directory`).
4. Case-insensitive keyword prefilter (high recall).
5. Hits go to a cheap LLM via the existing OpenRouter setup (high precision): "does this post describe a security incident / high-risk activity for <protocol>?" plus a severity grade. This filters false positives from common-word names (Compound, Balancer, ENA).
6. Confirmed hits join to subscribers; all alerts for one user in one run are merged into a single email.
7. Send via Plunk (`/v1/send`, self-hosted instance, HTML body, no template dependency): protocol name, severity, post author/source/time/text, link to the original post, link to re-scan the protocol, unsubscribe link.
8. Record `notifications` rows; mark posts processed. Send failures leave posts unprocessed for retry next run; `notifications` uniqueness prevents double-sending to users already notified.

### notifications table

| column | notes |
|---|---|
| user_id, post_id, protocol_slug | unique together — dedup guard |
| sent_at | timestamp |

## 5. Secrets & Config

Supabase edge function secrets (existing: OPENROUTER_API_KEY, JINA_API_KEY, BRAVE_SEARCH_API_KEY):

| new secret | source |
|---|---|
| REFRESH_SECRET | generated by us; gates `refresh-protocols` via the `x-refresh-key` header (function deployed `--no-verify-jwt`). A dedicated secret is deterministic — it avoids depending on which key format the platform injects as the service role. |
| INGEST_API_KEY | generated by us, shared with the scraper (their vault) |
| PLUNK_SECRET_KEY | user-provided (fresh account on self-hosted Plunk) |
| PLUNK_BASE_URL | `https://api.plunk.hanamizuki.tw` |
| HMAC_SECRET | generated by us, for unsubscribe links |

Deployment identity: project ref `rhqkbkckmukjhgunrclo`; PAT stored locally in `.env.supabase` (gitignored, exported via `source`), keeping the machine's Keychain login untouched. Migrations run via `supabase db push` if a DB password is provided, otherwise the SQL is handed to the user for the Dashboard SQL Editor.

Supabase Cron jobs: daily `refresh-protocols`, hourly `notify`.

## 6. Delivery Plan

| PR | contents | unblocks |
|---|---|---|
| 1 | protocol_directory + refresh function + prompt extension + enrichment + RELATED PROTOCOLS UI | features 1–3 of the original request |
| 2 | subscriptions table + bell UI + unsubscribe endpoint | — |
| 3 (small, can ship first) | security_posts + ingest-posts + INGEST_API_KEY generation | the scraper's Phase 2 |
| 4 | notifications + notify function + cron + Plunk integration | full alert loop |

PR 3 has no dependency on PR 1/2 and shipping it early lets the scraper start filling real data, so PR 4 can be tested against real posts.

## 7. Out of Scope / Known Limitations

- Supply-chain completeness is bounded by LLM knowledge; no on-chain dependency graph analysis.
- Quote posts rely on the scraper appending quoted text; nested cases (retweet of a quote) may still hide the protocol name in an unfetched layer.
- Watched-account list quality is owned by the scraper side.
- No in-app notification center, no digest frequency settings, no notification history UI in MVP.

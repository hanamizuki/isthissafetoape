# feat: notify pipeline with Plunk email alerts

## Requirements

- Create a `notifications` table (migration) to record sent alerts and prevent double-sends
- Create a `notify` edge function that runs the hourly alert pipeline end-to-end:
  1. Load all `security_posts` where `processed_at IS NULL`
  2. **Freshness guard**: posts with `posted_at` older than 24 hours → mark `processed_at = now()` WITHOUT notifying (prevents alert floods from the scraper's first backfill of ~480 posts and from downtime recovery)
  3. Build keyword set from **subscribed protocols only**: join `subscriptions` to `protocol_directory` and collect each protocol's `name`, `slug`, and `twitter` handle (strip leading `@` if present)
  4. **Case-insensitive keyword prefilter** (high recall): for each remaining post, check if `content` contains any keyword from the set. Track which protocols matched which posts
  5. **LLM precision filter**: for each (post, matched-protocol) pair, call OpenRouter (cheap model) asking: "Does this post describe a security incident or high-risk activity for <protocol>?" Return a boolean `isIncident` and a `severity` grade (critical / high / medium / low / info). This filters false positives from common-word protocol names (Compound, Balancer, ENA)
  6. **Merge alerts per user**: join confirmed hits to `subscriptions` to find subscribers; group all alerts for the same user in this run into a single email
  7. **Send via Plunk**: `POST {PLUNK_BASE_URL}/v1/send` with `Authorization: Bearer {PLUNK_SECRET_KEY}`, HTML body containing: protocol name, severity badge, post author/source/time/text, link to original post (`post_url`), link to re-scan (`https://isthissafetoape.com/report?url=<protocol_website>`), and an HMAC-signed unsubscribe link
  8. **Record notifications**: insert into `notifications` for each (user, post, protocol) that was emailed. The unique constraint prevents double-sends on retry
  9. **Mark processed**: set `processed_at = now()` on all posts loaded in step 1 (both fresh and stale). Send failures leave posts unprocessed for retry next run
- Gate the function with a dedicated `NOTIFY_SECRET` checked via the `x-notify-key` header. Deploy with `--no-verify-jwt` (same pattern as refresh-protocols and ingest-posts)
- Update README.md Supabase Setup section to document `notify` deployment + `NOTIFY_SECRET`
- Update the spec doc to confirm §4 matches what was built

### Constraints

- **Per-request Supabase client** — repo convention is to create the client inside the request handler, not at module scope. Follow the pattern in refresh-protocols/index.ts and ingest-posts/index.ts
- **No new npm/jsr dependencies** beyond what's already used (`npm:openai@^4`, `jsr:@supabase/supabase-js@2`)
- **HMAC signing must exactly reproduce the unsubscribe function's canonical recipe**: `sig = lowercase-hex(HMAC-SHA256(key = HMAC_SECRET, message = utf8(decimal-string(subscription_id))))`. Use `crypto.subtle.sign("HMAC", ...)` + byte-to-hex map. A valid sig is exactly 64 hex chars. See `unsubscribe/index.ts` header comment for the full spec
- **Unsubscribe link format**: `https://<SUPABASE_URL>/functions/v1/unsubscribe?id=<subscription_id>&sig=<hmac>` — targets the GET endpoint (confirmation page; the button POSTs the delete — anti-prefetch safe)
- **Re-scan link format**: `https://isthissafetoape.com/report?url=<protocol_website_from_directory>`
- **LLM model**: use `google/gemini-2.5-flash` as primary. No fallback chain needed — if it fails, the post stays unprocessed and retries next hour. Use the same OpenRouter pattern as analyze/index.ts (`npm:openai@^4` with baseURL `https://openrouter.ai/api/v1`)
- **One LLM call per (post, matched-protocol) pair** — do NOT batch multiple protocols into one call. Keep each call focused so the model gives a clear yes/no per protocol
- **Email HTML**: simple, inline-styled HTML. Dark background matching the site's cyberpunk theme. No external resources. Include `List-Unsubscribe` header pointing at the unsubscribe GET URL
- **Do NOT use the injected `SUPABASE_SERVICE_ROLE_KEY` for auth gating** — this project is mid-migration to Supabase's new API key format, so the injected key can't clear the JWT gateway. Use the dedicated `NOTIFY_SECRET` secret instead. The service role key is only used for creating the Supabase client (DB access)
- **Cron SQL**: do NOT include in the migration file. Cron is applied separately via `supabase db query --linked`. Document the SQL in the function's header comment (mirror refresh-protocols' pattern)

## Files to Read

- `supabase/functions/refresh-protocols/index.ts` — the `--no-verify-jwt` + shared-secret gate pattern, jsonResponse helper, and the pg_cron/pg_net/Vault cron SQL in the header comment. Mirror this pattern exactly for notify
- `supabase/functions/unsubscribe/index.ts` — the HMAC canonical recipe (verify side). PR 4 must reproduce the sign side exactly, or unsubscribe links won't verify. Read the header comment carefully
- `supabase/functions/analyze/index.ts` — the OpenRouter LLM call pattern (OpenAI SDK with baseURL, headers, model selection). Reuse this pattern for the precision filter
- `supabase/functions/ingest-posts/index.ts` — `security_posts` shape and the server-only RLS model to mirror for `notifications`
- `supabase/migrations/20260708125913_create_subscriptions.sql` — `subscriptions` columns and RLS model
- `supabase/migrations/20260708082240_create_protocol_directory.sql` — `protocol_directory` columns (twitter handle for keyword set)
- `supabase/migrations/20260708102528_create_security_posts.sql` — `security_posts` columns
- `README.md` — existing Supabase Setup section to extend
- `docs/spec/related-protocols-and-alerts.md` — §4 to verify matches implementation

## Files to Create/Modify

- `supabase/migrations/<YYYYMMDDHHMMSS>_create_notifications.sql` — new; the notifications table migration (use current timestamp for the filename prefix, format: 14-digit timestamp like the existing migrations)
- `supabase/functions/notify/index.ts` — new; the complete notify pipeline edge function
- `README.md` — modified; add notify deployment steps + NOTIFY_SECRET to the Supabase Setup section
- `docs/spec/related-protocols-and-alerts.md` — modified; update §4 status from "pending implementation" to reflect what was built, if there are any deviations

## Acceptance Criteria

- [ ] `supabase/migrations/*_create_notifications.sql` creates the table with correct columns, FK, unique constraint, RLS enabled, no client policies
- [ ] `supabase/functions/notify/index.ts` exists and handles: auth gate, freshness guard, keyword prefilter, LLM confirm, per-user email merge, Plunk send, notification recording, processed marking
- [ ] The HMAC signing in notify produces signatures that would pass the verification in `unsubscribe/index.ts` — same algorithm, same canonical message format (`decimal-string(id)`)
- [ ] The function uses per-request Supabase client creation (not module-scope)
- [ ] The function imports only `npm:openai@^4` and `jsr:@supabase/supabase-js@2`
- [ ] README.md Supabase Setup section includes `notify` deploy command and `NOTIFY_SECRET` setup
- [ ] The header comment in notify/index.ts includes the pg_cron/pg_net/Vault SQL for hourly scheduling (mirroring refresh-protocols' pattern)

## Notes

- The scraper feeds 12 accounts, ~40 posts each on first backfill = ~480 posts. The freshness guard (24h) ensures these don't trigger alerts
- `subscriptions.protocol_slug` is the DeFiLlama slug when resolved, else lowercased protocol name. The keyword set uses name + slug + twitter from the directory join, so even unresolved protocols (slug = lowercased name) get matched by name
- Send failure handling: if Plunk returns non-2xx for a user's email, that user's notifications rows should NOT be inserted (so the posts remain "unnotified" for that user). But the posts should still be marked processed (they were processed — just delivery failed for some users). The `notifications` unique constraint handles the case where a retry re-matches the same post to users who were already successfully notified
- Actually, re-reading the spec more carefully: "Send failures leave posts unprocessed for retry" — so if ANY send fails, don't mark those posts as processed. This is simpler: process posts only after ALL sends succeed. If a send fails, leave the post unprocessed entirely. The notifications unique constraint prevents double-sending to users who got the previous partial send
- The Plunk base URL is `https://api.plunk.hanamizuki.tw` (self-hosted instance), stored as `PLUNK_BASE_URL` edge secret
- For the LLM prompt, keep it focused: "You are a DeFi security analyst. Does this social media post describe a real security incident, exploit, hack, vulnerability, or high-risk activity specifically affecting the protocol named '<protocol>'? Respond with JSON: {isIncident: boolean, severity: 'critical'|'high'|'medium'|'low'|'info', reason: string}"

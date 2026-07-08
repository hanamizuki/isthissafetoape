// Pure wire→row mapping + batch dedupe for the ingest-posts function.
//
// The external scraper (nana's x-crypto-alerts) POSTs posts with its own field names
// (post_url, source_account, author, post_type, text, created_at, quoted_url). This maps
// each to a security_posts row, dropping malformed rows without failing the batch (the
// scraper retries whole batches by design, so one bad row must not reject the rest).

export interface SecurityPostRow {
  post_url: string;
  source_account: string;
  author: string;
  post_type: string;
  content: string;
  quoted_url: string | null;
  posted_at: string; // ISO 8601 (wire's created_at)
}

const POST_TYPES = new Set(["original", "reply", "retweet", "quote"]);

// Accept only http(s) URLs. post_url is the dedup key AND the "view original" link, and
// quoted_url feeds a link too — a non-http value (javascript:/data:/garbage) must never be
// stored, since the notify pipeline turns these into hrefs in subscriber emails.
function httpUrl(u: string): string | undefined {
  try {
    const proto = new URL(u).protocol;
    return proto === "https:" || proto === "http:" ? u : undefined;
  } catch {
    return undefined;
  }
}

// Map one wire post to a row, or null if it's malformed (missing/invalid required fields).
export function mapPost(p: unknown): SecurityPostRow | null {
  if (!p || typeof p !== "object") return null;
  const o = p as Record<string, unknown>;
  const trimmed = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

  const post_url = trimmed(o.post_url);
  const source_account = trimmed(o.source_account);
  const author = trimmed(o.author);
  const post_type = trimmed(o.post_type).toLowerCase();
  // Identifiers must be present; post_url must be a real http(s) URL; post_type one of four.
  if (!post_url || !httpUrl(post_url) || !source_account || !author) return null;
  if (!POST_TYPES.has(post_type)) return null;

  // text (wire) → content. Must be a string; may be empty (e.g. a media-only post).
  if (typeof o.text !== "string") return null;
  const content = o.text;

  // created_at (wire) → posted_at. Require a parseable timestamp in a sane range: JS Date
  // parses years far outside Postgres timestamptz's range (e.g. BC years), which would pass
  // the isNaN check but then fail the INSERT and sink the whole batch. Bound to [2000, now+1d].
  const posted = typeof o.created_at === "string" ? new Date(o.created_at) : new Date(NaN);
  if (isNaN(posted.getTime())) return null;
  if (posted.getUTCFullYear() < 2000 || posted.getTime() > Date.now() + 86_400_000) return null;

  // quoted_url (quotes only): keep only a valid http(s) URL, else null.
  const quoted_url = typeof o.quoted_url === "string" ? httpUrl(o.quoted_url.trim()) ?? null : null;

  return { post_url, source_account, author, post_type, content, quoted_url, posted_at: posted.toISOString() };
}

// Dedupe rows by post_url within a batch (keep first). Not strictly required under the
// current upsert (ignoreDuplicates:true → ON CONFLICT DO NOTHING already skips in-batch
// duplicates without error), but it trims redundant rows off the wire and stays a safeguard:
// switching the resolution to merge-duplicates (DO UPDATE) WOULD error on an in-batch
// duplicate ("cannot affect row a second time").
export function dedupeByUrl(rows: SecurityPostRow[]): SecurityPostRow[] {
  const seen = new Set<string>();
  const out: SecurityPostRow[] = [];
  for (const r of rows) {
    if (seen.has(r.post_url)) continue;
    seen.add(r.post_url);
    out.push(r);
  }
  return out;
}

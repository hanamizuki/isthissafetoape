import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";

// Related-protocol enrichment for the analyze function.
//
// The LLM supplies protocol NAMES ONLY (a hallucinated URL in a security product is a
// phishing vector). Each name is resolved to verified metadata:
//   1. protocol_directory case-insensitive exact name match
//   2. else prefix match, highest TVL ("Aave" → "Aave V3")
//   3. else CoinGecko fallback for the homepage (free tier, tolerate failure)
//   4. else keep the name with no link
// The primary protocol is resolved too so its slug is cached for subscriptions (feature 2).

export interface Resolution {
  website?: string;
  category?: string;
  slug?: string;
}

export interface RelatedEnriched extends Resolution {
  name: string;
  relationship: string;
}

// Escape LIKE metacharacters so a protocol name containing % or _ can't act as a
// wildcard in the ILIKE queries below. Postgres LIKE uses backslash as the escape char.
export function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, "\\$&");
}

// Project a protocol_directory row to the Resolution shape, dropping empty fields so the
// spread in buildEnrichedRelated never overwrites a name with undefined.
export function pickRow(
  row: { slug?: string | null; url?: string | null; category?: string | null },
): Resolution {
  const out: Resolution = {};
  if (row.url) out.website = row.url;
  if (row.category) out.category = row.category;
  if (row.slug) out.slug = row.slug;
  return out;
}

// Merge the LLM's [{name, relationship}] list with resolutions keyed by lowercased name.
// Rows without a usable name are dropped; unresolved names keep name + relationship only.
export function buildEnrichedRelated(
  llmRelated: unknown,
  resolutions: Map<string, Resolution>,
): RelatedEnriched[] {
  if (!Array.isArray(llmRelated)) return [];
  const out: RelatedEnriched[] = [];
  for (const r of llmRelated) {
    const name = typeof r?.name === "string" ? r.name.trim() : "";
    if (!name) continue;
    const relationship = typeof r?.relationship === "string" ? r.relationship : "";
    out.push({ name, relationship, ...(resolutions.get(name.toLowerCase()) ?? {}) });
  }
  return out;
}

async function resolveViaDirectory(admin: SupabaseClient, name: string): Promise<Resolution | null> {
  const escaped = escapeLike(name);
  // 1. Case-insensitive exact match (ILIKE with no wildcards). Highest TVL wins if the
  //    directory somehow holds duplicate names.
  const exact = await admin
    .from("protocol_directory")
    .select("slug, url, category, tvl")
    .ilike("name", escaped)
    .order("tvl", { ascending: false, nullsFirst: false })
    .limit(1);
  if (exact.data && exact.data.length > 0) return pickRow(exact.data[0]);

  // 2. Prefix match, highest TVL ("Aave" → "Aave V3" over "Aave V2").
  const prefix = await admin
    .from("protocol_directory")
    .select("slug, url, category, tvl")
    .ilike("name", `${escaped}%`)
    .order("tvl", { ascending: false, nullsFirst: false })
    .limit(1);
  if (prefix.data && prefix.data.length > 0) return pickRow(prefix.data[0]);

  return null;
}

async function resolveViaCoinGecko(name: string): Promise<Resolution | null> {
  try {
    const search = await fetch(
      `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(name)}`,
      { signal: AbortSignal.timeout(8_000) },
    );
    if (!search.ok) {
      await search.body?.cancel();
      return null;
    }
    const sj = await search.json();
    const id = sj?.coins?.[0]?.id;
    if (typeof id !== "string" || !id) return null;

    const coin = await fetch(
      `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false`,
      { signal: AbortSignal.timeout(8_000) },
    );
    if (!coin.ok) {
      await coin.body?.cancel();
      return null;
    }
    const cj = await coin.json();
    const homepage = Array.isArray(cj?.links?.homepage)
      ? cj.links.homepage.find((h: unknown) => typeof h === "string" && h.length > 0)
      : undefined;
    if (!homepage) return null;

    // CoinGecko-resolved protocols have no DeFiLlama slug, so subscriptions (feature 2)
    // fall back to the lowercased name — slug stays undefined here on purpose.
    const category = Array.isArray(cj?.categories)
      ? cj.categories.find((c: unknown) => typeof c === "string" && c.length > 0)
      : undefined;
    const out: Resolution = { website: homepage };
    if (typeof category === "string") out.category = category;
    return out;
  } catch (err) {
    console.error("[enrich] CoinGecko lookup failed", {
      name,
      error: err instanceof Error ? err.message : err,
    });
    return null;
  }
}

// Directory first, CoinGecko fallback, name-only last. Never throws.
export async function resolveProtocol(admin: SupabaseClient, name: string): Promise<Resolution> {
  try {
    const dir = await resolveViaDirectory(admin, name);
    if (dir) return dir;
    const cg = await resolveViaCoinGecko(name);
    if (cg) return cg;
  } catch (err) {
    console.error("[enrich] resolveProtocol failed", {
      name,
      error: err instanceof Error ? err.message : err,
    });
  }
  return {};
}

// Mutates `report`: resolves the primary protocol and every LLM-extracted related
// protocol, merging verified metadata into report_json. Best-effort — the caller runs
// this inside a try/catch so a total failure still returns the core risk report.
export async function enrichReport(
  admin: SupabaseClient,
  report: Record<string, unknown>,
): Promise<void> {
  const llmRelated = report.relatedProtocols;
  const primaryName = typeof report.projectName === "string" ? report.projectName.trim() : "";

  // Unique names (primary + related), resolved once each and reused — this dedupe keeps
  // duplicate names from spending two CoinGecko calls against the free-tier rate limit.
  const names = new Set<string>();
  if (primaryName) names.add(primaryName);
  if (Array.isArray(llmRelated)) {
    for (const r of llmRelated) {
      if (typeof r?.name === "string" && r.name.trim()) names.add(r.name.trim());
    }
  }

  const resolutions = new Map<string, Resolution>();
  await Promise.all(
    [...names].map(async (n) => {
      resolutions.set(n.toLowerCase(), await resolveProtocol(admin, n));
    }),
  );

  report.relatedProtocols = buildEnrichedRelated(llmRelated, resolutions);
  if (primaryName) {
    report.primaryProtocol = {
      name: primaryName,
      ...(resolutions.get(primaryName.toLowerCase()) ?? {}),
    };
  }
}

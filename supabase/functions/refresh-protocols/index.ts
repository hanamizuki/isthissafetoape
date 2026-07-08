import { createClient } from "jsr:@supabase/supabase-js@2";

// refresh-protocols
// -----------------
// Pulls DeFiLlama's full /protocols list (~7,800 entries, free, no key) and upserts a
// slimmed subset into the protocol_directory table. Scheduled daily via Supabase Cron so
// the multi-MB fetch never runs on the analyze hot path.
//
// Auth: gated on the service-role key. Without this, any holder of the public anon key
// could trigger repeated multi-MB fetches + full-table upserts. The service-role key is a
// valid project JWT, so it also clears the gateway's default JWT check.
//
// Deploy + schedule (run once, values are project-specific — not committed):
//   supabase functions deploy refresh-protocols --project-ref <ref>
//   # store the service-role key in Vault, then schedule via pg_cron + pg_net:
//   select vault.create_secret('<service-role-key>', 'service_role_key');
//   select cron.schedule('refresh-protocols-daily', '0 3 * * *', $$
//     select net.http_post(
//       url    := 'https://<ref>.supabase.co/functions/v1/refresh-protocols',
//       headers := jsonb_build_object(
//         'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key'),
//         'Content-Type', 'application/json')
//     ) $$);
//   # first population (immediate): curl with the service-role key as the Bearer token.

const DEFILLAMA_PROTOCOLS = "https://api.llama.fi/protocols";
const BATCH_SIZE = 1000;

interface LlamaProtocol {
  slug?: string;
  name?: string;
  url?: string | null;
  category?: string | null;
  twitter?: string | null;
  gecko_id?: string | null;
  tvl?: number | null;
}

interface DirectoryRow {
  slug: string;
  name: string;
  url: string | null;
  category: string | null;
  twitter: string | null;
  gecko_id: string | null;
  tvl: number | null;
  updated_at: string;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  if (req.headers.get("Authorization") !== `Bearer ${serviceKey}`) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  try {
    const res = await fetch(DEFILLAMA_PROTOCOLS, {
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) {
      await res.body?.cancel();
      return jsonResponse({ error: `DeFiLlama fetch failed: ${res.status}` }, 502);
    }
    const protocols = await res.json();
    if (!Array.isArray(protocols)) {
      return jsonResponse({ error: "Unexpected DeFiLlama payload" }, 502);
    }

    const now = new Date().toISOString();
    // Dedupe by slug (the primary key): DeFiLlama occasionally lists a slug twice, and a
    // single upsert batch that touches the same PK row twice errors ("ON CONFLICT DO
    // UPDATE cannot affect row a second time"). Keep the highest-TVL occurrence.
    const bySlug = new Map<string, DirectoryRow>();
    for (const p of protocols as LlamaProtocol[]) {
      if (!p.slug || !p.name) continue;
      const tvl = typeof p.tvl === "number" ? p.tvl : null;
      const existing = bySlug.get(p.slug);
      if (existing && (tvl ?? -1) <= (existing.tvl ?? -1)) continue;
      bySlug.set(p.slug, {
        slug: p.slug,
        name: p.name,
        url: p.url ?? null,
        category: p.category ?? null,
        twitter: p.twitter ?? null,
        gecko_id: p.gecko_id ?? null,
        tvl,
        updated_at: now,
      });
    }
    const rows = [...bySlug.values()];

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey);

    let upserted = 0;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const { error } = await admin
        .from("protocol_directory")
        .upsert(batch, { onConflict: "slug" });
      if (error) {
        console.error("[refresh-protocols] upsert batch failed", { offset: i, error: error.message });
        return jsonResponse({ error: `Upsert failed at offset ${i}: ${error.message}`, upserted }, 500);
      }
      upserted += batch.length;
    }

    return jsonResponse({ upserted, source: protocols.length });
  } catch (err) {
    console.error("[refresh-protocols] fatal", err);
    return jsonResponse({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

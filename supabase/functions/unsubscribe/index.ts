import { createClient } from "jsr:@supabase/supabase-js@2";

// unsubscribe
// -----------
// Public, login-free endpoint for the "unsubscribe" link in every alert email (PR 4). It
// authenticates the request with an HMAC signature over the subscription id — NOT a JWT — so a
// user can unsubscribe straight from their inbox without logging in.
//
//   GET  /functions/v1/unsubscribe?id=<subscription_id>&sig=<hmac>  → confirmation page (no side effect)
//   POST /functions/v1/unsubscribe?id=<subscription_id>&sig=<hmac>  → deletes the subscription
//
// GET is side-effect-free by design: email security scanners and link prefetchers (Microsoft
// Safe Links, Mimecast, Proofpoint, Barracuda) issue automated GETs against links in mail, so a
// destructive GET would silently unsubscribe users before they ever click. The delete happens
// only on the POST that the confirmation page's button submits. (PR 4 may additionally send an
// RFC 8058 `List-Unsubscribe-Post` header pointing at this same POST for native one-click.)
//
// Canonical signature — PR 4's email link builder MUST reproduce this exactly, or links won't
// verify:
//   sig = lowercase-hex( HMAC-SHA256( key = HMAC_SECRET, message = utf8(decimal-string(id)) ) )
// No expiry: an unsubscribe link must keep working for the life of the email it was sent in.
//
// A valid HMAC is required for both GET and POST. The delete uses the service role (bypasses the
// per-user RLS on subscriptions). An invalid or malformed request renders an error page and never
// reveals whether the id existed.
//
// Deploy (public — the HMAC is the only gate, so the JWT gateway must be off; same pattern as
// refresh-protocols / ingest-posts, which the new API-key format made necessary):
//   supabase secrets set HMAC_SECRET=<random-hex>
//   supabase functions deploy unsubscribe --use-api --no-verify-jwt --project-ref <ref>

const encoder = new TextEncoder();

// Parse hex (either case) to bytes; null on malformed input (empty, odd length, or non-hex).
function hexToBytes(hex: string): Uint8Array | null {
  if (hex.length === 0 || hex.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(hex)) return null;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

// Constant-time HMAC verification: crypto.subtle.verify compares internally, so a bad signature
// never leaks timing about how many leading bytes matched.
async function verifySignature(id: string, sigHex: string, secret: string): Promise<boolean> {
  const sigBytes = hexToBytes(sigHex);
  if (!sigBytes) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  return await crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(id));
}

// Shared page chrome. htmlPage's title/message are always static literals; confirmPage's id/sig
// are validated to safe charsets before use. Never interpolate a user- or DB-controlled value
// into either without escaping it first.
const PAGE_HEAD = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
    background:#0a0a0f; color:#e6e6e6; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; padding:1rem; }
  .card { max-width:420px; padding:2.5rem 2rem; text-align:center;
    border:2px solid rgba(34,211,238,.2); background:rgba(255,255,255,.02); }
  h1 { font-size:1rem; letter-spacing:.05em; color:#22d3ee; margin:0 0 1rem; }
  p { font-size:.95rem; line-height:1.6; color:#a1a1aa; margin:0 0 1.5rem; }
  a { color:#22d3ee; text-decoration:none; border-bottom:1px solid rgba(34,211,238,.4); }
  button { font:inherit; cursor:pointer; padding:.7rem 1.5rem; color:#0a0a0f; background:#22d3ee;
    border:none; letter-spacing:.03em; }
  button:hover { background:#67e8f9; }
</style>
</head>
<body>`;
const PAGE_FOOT = `</body>
</html>`;

function htmlPage(title: string, message: string, status: number): Response {
  const body = `${PAGE_HEAD}
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="https://isthissafetoape.com">← Back to IsThisSafeToApe</a>
  </div>
${PAGE_FOOT}`;
  return new Response(body, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

// Confirmation page shown on GET. Its button POSTs the same id+sig back, so the delete only
// happens on a real user action, not a scanner/prefetcher GET. id (^\d+$) and sig (hex) are
// already validated to safe charsets before this renders, so interpolating them into the form
// action is XSS-safe.
function confirmPage(id: string, sig: string): Response {
  const body = `${PAGE_HEAD}
  <div class="card">
    <h1>Unsubscribe?</h1>
    <p>Stop receiving security alerts for this protocol?</p>
    <form method="POST" action="?id=${id}&sig=${sig}">
      <button type="submit">Confirm unsubscribe</button>
    </form>
  </div>
${PAGE_FOOT}`;
  return new Response(body, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

Deno.serve(async (req) => {
  const secret = Deno.env.get("HMAC_SECRET");
  if (!secret) {
    return htmlPage("Unavailable", "Unsubscribe is temporarily unavailable. Please try again later.", 500);
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id") ?? "";
  const sig = url.searchParams.get("sig") ?? "";

  // id is a bigint identity — accept only a plain positive-integer string before using it.
  if (!/^\d+$/.test(id) || !(await verifySignature(id, sig, secret))) {
    return htmlPage("Invalid link", "This unsubscribe link is invalid or has been tampered with.", 400);
  }

  // GET (or any non-POST) is side-effect-free: show a confirmation page whose button POSTs back.
  if (req.method !== "POST") {
    return confirmPage(id, sig);
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { error } = await admin.from("subscriptions").delete().eq("id", id);
  if (error) {
    console.error("[unsubscribe] delete failed", error.message);
    return htmlPage("Something went wrong", "We couldn't process your request. Please try again later.", 500);
  }

  // Deleting an already-gone id is a no-op — still show success so repeated clicks from the same
  // email don't look broken.
  return htmlPage("Unsubscribed", "You've been unsubscribed and won't receive further alerts for this protocol.", 200);
});

// Pure-logic checks for ingest-posts wire mapping + dedupe. Run with: deno test
import { assertEquals } from "jsr:@std/assert@1";
import { dedupeByUrl, mapPost, type SecurityPostRow } from "./mapping.ts";

Deno.test("mapPost maps wire fields (text→content, created_at→posted_at) and ignores extras", () => {
  const row = mapPost({
    post_url: "https://x.com/lookonchain/status/123",
    source_account: "lookonchain",
    author: "lookonchain",
    post_type: "original",
    text: "USDC depeg alert",
    created_at: "2026-07-08T02:00:00Z",
    quoted_url: null,
    engagement: { likes: 5 }, // unknown extra → ignored
  });
  assertEquals(row, {
    post_url: "https://x.com/lookonchain/status/123",
    source_account: "lookonchain",
    author: "lookonchain",
    post_type: "original",
    content: "USDC depeg alert",
    quoted_url: null,
    posted_at: "2026-07-08T02:00:00.000Z",
  });
});

Deno.test("mapPost lowercases post_type and keeps quoted_url for quotes", () => {
  const row = mapPost({
    post_url: "u", source_account: "a", author: "b",
    post_type: "Quote", text: "comment\n[quoted] orig", created_at: "2026-07-08T00:00:00Z",
    quoted_url: "https://x.com/orig/status/1",
  });
  assertEquals(row?.post_type, "quote");
  assertEquals(row?.quoted_url, "https://x.com/orig/status/1");
  assertEquals(row?.content, "comment\n[quoted] orig");
});

Deno.test("mapPost rejects malformed rows", () => {
  const base = { post_url: "u", source_account: "a", author: "b", post_type: "original", text: "t", created_at: "2026-07-08T00:00:00Z" };
  assertEquals(mapPost(null), null);
  assertEquals(mapPost("nope"), null);
  assertEquals(mapPost({ ...base, post_url: "" }), null); // missing id
  assertEquals(mapPost({ ...base, source_account: "  " }), null); // blank identifier
  assertEquals(mapPost({ ...base, post_type: "repost" }), null); // unknown type
  assertEquals(mapPost({ ...base, text: 123 }), null); // text not a string
  assertEquals(mapPost({ ...base, created_at: "not-a-date" }), null); // unparseable timestamp
  assertEquals(mapPost({ ...base, created_at: 12345 }), null); // timestamp not a string
});

Deno.test("mapPost allows empty text (media-only post)", () => {
  const row = mapPost({ post_url: "u", source_account: "a", author: "b", post_type: "retweet", text: "", created_at: "2026-07-08T00:00:00Z" });
  assertEquals(row?.content, "");
});

Deno.test("dedupeByUrl keeps the first occurrence per post_url", () => {
  const mk = (url: string, content: string): SecurityPostRow => ({
    post_url: url, source_account: "a", author: "b", post_type: "original", content, quoted_url: null, posted_at: "2026-07-08T00:00:00.000Z",
  });
  const out = dedupeByUrl([mk("u1", "first"), mk("u2", "x"), mk("u1", "second")]);
  assertEquals(out.length, 2);
  assertEquals(out[0].content, "first");
  assertEquals(out.map((r) => r.post_url), ["u1", "u2"]);
});

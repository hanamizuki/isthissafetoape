// Pure-logic checks for the related-protocol enrichment. Run with: deno test
import { assertEquals } from "jsr:@std/assert@1";
import { buildEnrichedRelated, escapeLike, pickRow, type Resolution } from "./enrich.ts";

Deno.test("escapeLike neutralizes LIKE wildcards", () => {
  assertEquals(escapeLike("Aave"), "Aave"); // no metachars → unchanged
  assertEquals(escapeLike("100%_pool"), "100\\%\\_pool");
  assertEquals(escapeLike("a\\b"), "a\\\\b");
});

Deno.test("pickRow keeps present fields and drops empty ones", () => {
  assertEquals(
    pickRow({ slug: "aave", url: "https://aave.com", category: "Lending" }),
    { website: "https://aave.com", category: "Lending", slug: "aave" },
  );
  assertEquals(pickRow({ slug: null, url: null, category: null }), {});
  assertEquals(pickRow({ slug: "curve", url: null, category: null }), { slug: "curve" });
});

Deno.test("buildEnrichedRelated merges resolutions, keeps unresolved, drops nameless", () => {
  const resolutions = new Map<string, Resolution>([
    ["aave", { website: "https://aave.com", category: "Lending", slug: "aave" }],
  ]);
  const out = buildEnrichedRelated(
    [
      { name: "Aave", relationship: "underlying lending market" },
      { name: "  ", relationship: "blank name — dropped" },
      { relationship: "missing name — dropped" },
      "not an object", // dropped
      { name: "Unknown Proto", relationship: "oracle" }, // unresolved → name + relationship only
    ],
    resolutions,
  );
  assertEquals(out, [
    { name: "Aave", relationship: "underlying lending market", website: "https://aave.com", category: "Lending", slug: "aave" },
    { name: "Unknown Proto", relationship: "oracle" },
  ]);
});

Deno.test("buildEnrichedRelated tolerates non-array input", () => {
  assertEquals(buildEnrichedRelated(undefined, new Map()), []);
  assertEquals(buildEnrichedRelated(null, new Map()), []);
  assertEquals(buildEnrichedRelated({ name: "x" }, new Map()), []);
});

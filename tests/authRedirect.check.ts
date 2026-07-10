// Self-check for the open-redirect guard on the auth flow.
// Run with: bun tests/authRedirect.check.ts
// (lives outside src/ so `tsc -b` does not include it in the app build)

import { sanitizeRedirect } from "../src/lib/authRedirect"

const ORIGIN = "https://isthissafetoape.com"

const cases: Array<{ input: string | null; expected: string | null; why: string }> = [
  // valid internal destinations pass through
  { input: "/history", expected: "/history", why: "plain internal path" },
  {
    input: "/report?url=https%3A%2F%2Fapp.uniswap.org&tab=1",
    expected: "/report?url=https%3A%2F%2Fapp.uniswap.org&tab=1",
    why: "nested encoded query survives",
  },
  { input: "/report/abc#section", expected: "/report/abc#section", why: "hash preserved" },
  { input: "/", expected: "/", why: "root" },

  // everything else falls back to null (callers use "/")
  { input: null, expected: null, why: "missing" },
  { input: "", expected: null, why: "empty" },
  { input: "https://evil.com/phish", expected: null, why: "absolute external URL" },
  { input: "//evil.com/phish", expected: null, why: "protocol-relative URL" },
  { input: "/\\evil.com", expected: null, why: "backslash normalizes to //evil.com" },
  { input: "/..//evil.com", expected: null, why: "dot-segment collapses to //evil.com" },
  { input: "/%2e%2e//evil.com", expected: null, why: "encoded dot-segment collapses to //evil.com" },
  { input: "/a/b/../..//evil.com", expected: null, why: "nested dot-segments collapse to //evil.com" },
  { input: "/.//evil.com", expected: null, why: "single-dot segment collapses to //evil.com" },
  { input: "javascript:alert(1)", expected: null, why: "javascript scheme" },
  { input: "history", expected: null, why: "relative path (no leading slash)" },
  { input: "http://isthissafetoape.com/x", expected: null, why: "absolute even if same host" },
]

let failed = 0
for (const { input, expected, why } of cases) {
  const got = sanitizeRedirect(input, ORIGIN)
  if (got !== expected) {
    failed++
    console.error(`FAIL (${why}): sanitizeRedirect(${JSON.stringify(input)}) → ${JSON.stringify(got)}, expected ${JSON.stringify(expected)}`)
  }
}

if (failed > 0) {
  console.error(`${failed}/${cases.length} checks failed`)
  process.exit(1)
}
console.log(`ok — ${cases.length} redirect-sanitizer checks passed`)

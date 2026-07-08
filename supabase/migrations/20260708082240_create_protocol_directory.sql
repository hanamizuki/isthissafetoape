-- Protocol directory: a slimmed snapshot of DeFiLlama's /protocols list, refreshed
-- daily by the refresh-protocols edge function. The analyze function resolves
-- LLM-extracted protocol names against this table to attach verified official
-- metadata — an LLM-supplied URL is never trusted (phishing vector).
create table public.protocol_directory (
  slug text primary key,          -- DeFiLlama slug; also the subscription key (feature 2)
  name text not null,
  url text,                       -- official website; nullable (some entries lack one)
  category text,
  twitter text,
  gecko_id text,                  -- CoinGecko id, for cross-referencing
  tvl double precision,           -- used to break ties on prefix name matches
  updated_at timestamptz not null default now()
);

comment on table public.protocol_directory is 'Slimmed DeFiLlama protocol list for name→website resolution; refreshed daily by refresh-protocols';

-- Name lookups are case-insensitive exact + prefix (ILIKE) with an ORDER BY tvl.
-- ponytail: no pg_trgm GIN index — ~7.8k rows seq-scan in well under a millisecond;
-- add one only if the directory grows an order of magnitude.

alter table public.protocol_directory enable row level security;
-- No client policies on purpose: the directory is read only server-side (analyze
-- enrichment) and written only by refresh-protocols, both through the service role
-- which bypasses RLS. This mirrors the server-only access model of rate_limits.

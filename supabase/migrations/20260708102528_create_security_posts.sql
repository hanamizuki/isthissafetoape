-- Security-alert posts ingested from the external X (Twitter) scraper (nana's
-- x-crypto-alerts task). The scraper POSTs new posts hourly to the ingest-posts edge
-- function; the notify pipeline (a later PR) reads unprocessed rows and emails subscribers.
create table public.security_posts (
  id bigint generated always as identity primary key,   -- stable id, referenced by notifications (PR 4)
  post_url text not null unique,   -- dedup key (matches the scraper's PK); also the "view original" link
  source_account text not null,    -- which watched account's timeline surfaced the post
  author text not null,            -- content author (for retweets, the original author)
  post_type text not null,         -- original / reply / retweet / quote
  content text not null,           -- post text; for quotes the scraper appends the quoted text
  quoted_url text,                 -- nullable, quotes only
  posted_at timestamptz not null,  -- original post time
  received_at timestamptz not null default now(),  -- ingest time
  processed_at timestamptz         -- set by the notify pipeline; null = not yet processed
);

comment on table public.security_posts is 'Security-alert posts ingested from the external X scraper; consumed by the notify pipeline';

-- The notify pipeline scans unprocessed posts by recency (processed_at is null, newest
-- first). A partial index keeps that scan cheap as the table grows with hourly ingest.
create index idx_security_posts_unprocessed on public.security_posts (posted_at desc) where processed_at is null;

alter table public.security_posts enable row level security;
-- No client policies on purpose: written only by ingest-posts and read only by the notify
-- pipeline, both through the service role which bypasses RLS. Mirrors the server-only
-- access model of protocol_directory / rate_limits.

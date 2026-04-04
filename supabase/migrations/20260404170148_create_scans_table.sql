
-- Scans table: stores analysis results for caching and history
create table public.scans (
  id bigint generated always as identity primary key,
  url text not null,
  url_hostname text not null,
  project_name text,
  total_score integer,
  max_score integer default 100,
  risk_level text,
  risk_label text,
  tldr text,
  report_json jsonb,
  created_at timestamptz default now()
);

comment on table public.scans is 'Cached DeFi project risk assessment scan results';

create index idx_scans_url_hostname on public.scans(url_hostname);
create index idx_scans_created_at on public.scans(created_at desc);

alter table public.scans enable row level security;

-- Anyone can read scans
create policy "Anyone can read scans"
  on public.scans for select to anon using (true);

-- Only server (via service role) inserts scans — no direct anon insert
-- Edge function will use service role key to insert

-- Rate limit tracking table (by IP fingerprint hash)
create table public.rate_limits (
  id bigint generated always as identity primary key,
  fingerprint text not null,
  scan_count integer default 1,
  window_start timestamptz default now(),
  created_at timestamptz default now()
);

comment on table public.rate_limits is 'Tracks daily scan usage per visitor for rate limiting';

create unique index idx_rate_limits_fingerprint on public.rate_limits(fingerprint);
create index idx_rate_limits_window on public.rate_limits(window_start);

alter table public.rate_limits enable row level security;

-- Rate limits are only accessed by edge functions via service role
-- No direct client access needed


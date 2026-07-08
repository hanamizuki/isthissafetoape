-- Per-protocol security-alert subscriptions. A logged-in user "follows" a protocol from the
-- report-page bell; the notify pipeline (PR 4) emails them when a watched X account posts
-- about it. Unlike the server-only tables (scans / protocol_directory / security_posts),
-- this table is read and written directly by the browser client under the logged-in user, so
-- it carries real per-user RLS policies.
create table public.subscriptions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  protocol_slug text not null,   -- subscription key: DeFiLlama slug when resolved, else lowercased protocol name
  protocol_name text not null,   -- display name shown in the UI and alert emails
  created_at timestamptz not null default now(),
  unique (user_id, protocol_slug)   -- one subscription per protocol per user; the bell toggles this row
);

comment on table public.subscriptions is 'Per-user protocol subscriptions driving security-alert emails';

create index idx_subscriptions_user_id on public.subscriptions(user_id);

alter table public.subscriptions enable row level security;

-- Per-user policies: the browser client may only see and modify its own rows. The unsubscribe
-- edge function deletes via the service role (bypasses RLS) after verifying an HMAC signature,
-- so no anon policy is needed here.
create policy "Users can read own subscriptions"
  on public.subscriptions for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own subscriptions"
  on public.subscriptions for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own subscriptions"
  on public.subscriptions for delete to authenticated
  using ((select auth.uid()) = user_id);

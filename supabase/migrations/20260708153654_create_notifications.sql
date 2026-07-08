-- Notification records: tracks which (user, post, protocol) combinations have been emailed
-- by the notify pipeline (PR 4). The unique constraint prevents double-sends when the
-- pipeline retries a partially-failed run — posts that already generated a notification row
-- for a given user+protocol are skipped.
create table public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id bigint not null references public.security_posts(id) on delete cascade,
  protocol_slug text not null,
  sent_at timestamptz not null default now(),
  unique (user_id, post_id, protocol_slug)
);

comment on table public.notifications is 'Tracks sent alert emails; unique constraint prevents double-sends on pipeline retry';

alter table public.notifications enable row level security;
-- No client policies on purpose: written only by the notify edge function through the
-- service role which bypasses RLS. Mirrors the server-only access model of
-- protocol_directory / security_posts / rate_limits.

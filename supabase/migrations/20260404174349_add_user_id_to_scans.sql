alter table public.scans add column user_id uuid references auth.users(id);

create index idx_scans_user_id on public.scans(user_id);

-- Users can read their own scans
create policy "Users can read own scans"
  on public.scans for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Authenticated can read scans"
  on public.scans for select to authenticated using (true);

alter table public.listings enable row level security;
alter table public.listing_price_history enable row level security;
alter table public.listing_activity_logs enable row level security;
alter table public.crawler_runs enable row level security;
alter table public.crawler_site_runs enable row level security;
alter table public.crawl_jobs enable row level security;

drop policy if exists "Allow read for authenticated users" on public.listings;
drop policy if exists "Allow updates for authenticated users" on public.listings;
drop policy if exists listings_authenticated_read_active on public.listings;
drop policy if exists listings_authenticated_update on public.listings;
create policy listings_authenticated_read_active
  on public.listings for select to authenticated
  using (deleted_at is null);
create policy listings_authenticated_update
  on public.listings for update to authenticated
  using (deleted_at is null) with check (deleted_at is null);

drop policy if exists listing_price_history_authenticated_read on public.listing_price_history;
create policy listing_price_history_authenticated_read
  on public.listing_price_history for select to authenticated
  using (true);

drop policy if exists "Utilizatorii autentificați pot citi jurnalele de activitate" on public.listing_activity_logs;
drop policy if exists "Utilizatorii autentificați pot adăuga jurnale de activitate" on public.listing_activity_logs;
drop policy if exists listing_activity_authenticated_read on public.listing_activity_logs;
drop policy if exists listing_activity_insert_own_identity on public.listing_activity_logs;
create policy listing_activity_authenticated_read
  on public.listing_activity_logs for select to authenticated
  using (true);
create policy listing_activity_insert_own_identity
  on public.listing_activity_logs for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Authenticated users can read crawler runs" on public.crawler_runs;
drop policy if exists crawler_runs_authenticated_read on public.crawler_runs;
create policy crawler_runs_authenticated_read
  on public.crawler_runs for select to authenticated using (true);

drop policy if exists "Authenticated users can read crawler site runs" on public.crawler_site_runs;
drop policy if exists crawler_site_runs_authenticated_read on public.crawler_site_runs;
create policy crawler_site_runs_authenticated_read
  on public.crawler_site_runs for select to authenticated using (true);

create or replace function public.soft_delete_listing(target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() not in ('authenticated', 'service_role') then
    raise exception 'Authentication required';
  end if;
  update public.listings set deleted_at = now()
  where id = target_id and deleted_at is null;
end;
$$;

create or replace function public.restore_listing(target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() not in ('authenticated', 'service_role') then
    raise exception 'Authentication required';
  end if;
  update public.listings set deleted_at = null
  where id = target_id and deleted_at is not null;
end;
$$;

revoke all on function public.soft_delete_listing(uuid) from public, anon;
revoke all on function public.restore_listing(uuid) from public, anon;
grant execute on function public.soft_delete_listing(uuid) to authenticated, service_role;
grant execute on function public.restore_listing(uuid) to authenticated, service_role;

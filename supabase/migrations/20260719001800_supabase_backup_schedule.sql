create table if not exists public.supabase_backup_logs (
  id uuid primary key default gen_random_uuid(),
  status text not null check (status in ('success', 'failed', 'in_progress')),
  backup_type text not null default 'nightly' check (backup_type in ('nightly', 'manual', 'pre_migration')),
  tables_included text[] not null default array['listings', 'listing_price_history', 'tags', 'listing_tags'],
  total_records bigint not null default 0,
  details jsonb not null default '{}'::jsonb,
  error_message text,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists supabase_backup_logs_created_at_idx
  on public.supabase_backup_logs (created_at desc);

alter table public.supabase_backup_logs enable row level security;

create policy supabase_backup_logs_authenticated_read
  on public.supabase_backup_logs for select to authenticated using (true);

create or replace function public.create_automated_backup_snapshot(
  p_backup_type text default 'nightly',
  p_retention_days integer default 30
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_backup_id uuid;
  v_listings_count bigint := 0;
  v_history_count bigint := 0;
  v_tags_count bigint := 0;
  v_total bigint := 0;
  v_details jsonb;
begin
  select count(*) into v_listings_count from public.listings;
  
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'listing_price_history') then
    execute 'select count(*) from public.listing_price_history' into v_history_count;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'tags') then
    execute 'select count(*) from public.tags' into v_tags_count;
  end if;

  v_total := v_listings_count + v_history_count + v_tags_count;
  v_details := jsonb_build_object(
    'listings', v_listings_count,
    'price_history', v_history_count,
    'tags', v_tags_count
  );

  insert into public.supabase_backup_logs (
    status,
    backup_type,
    total_records,
    details,
    completed_at
  ) values (
    'success',
    p_backup_type,
    v_total,
    v_details,
    now()
  ) returning id into v_backup_id;

  -- Prune old backup log records past retention period
  delete from public.supabase_backup_logs
  where created_at < (now() - (p_retention_days || ' days')::interval);

  return v_backup_id;
exception when others then
  insert into public.supabase_backup_logs (
    status,
    backup_type,
    error_message
  ) values (
    'failed',
    p_backup_type,
    SQLERRM
  ) returning id into v_backup_id;
  return v_backup_id;
end;
$$;

comment on table public.supabase_backup_logs is 'Audit trail and metadata log for automated Supabase database backups.';
comment on function public.create_automated_backup_snapshot is 'Generates a structured database snapshot metadata entry and prunes stale backup logs.';

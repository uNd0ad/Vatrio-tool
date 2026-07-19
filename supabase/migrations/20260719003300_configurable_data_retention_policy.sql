-- Configurable data retention policies per table

create table if not exists public.data_retention_policies (
  table_name text primary key,
  retention_days integer not null check (retention_days > 0),
  updated_at timestamptz not null default now()
);

insert into public.data_retention_policies (table_name, retention_days)
values
  ('listing_snapshots', 180),
  ('listing_audit_logs', 365),
  ('supabase_backup_logs', 90)
on conflict (table_name) do nothing;

create or replace function public.enforce_data_retention_policies()
returns void
language plpgsql
security definer
as $$
begin
  -- Purge old snapshots
  delete from public.listing_snapshots
  where created_at < now() - (
    select (retention_days || ' days')::interval
    from public.data_retention_policies
    where table_name = 'listing_snapshots'
  );

  -- Purge old audit logs
  delete from public.listing_audit_logs
  where changed_at < now() - (
    select (retention_days || ' days')::interval
    from public.data_retention_policies
    where table_name = 'listing_audit_logs'
  );
end;
$$;

alter table public.data_retention_policies enable row level security;

create policy "Allow read access to authenticated users for data_retention_policies"
  on public.data_retention_policies for select
  to authenticated
  using (true);

comment on table public.data_retention_policies is
  'Configurable data retention rules specifying maximum age in days per table.';

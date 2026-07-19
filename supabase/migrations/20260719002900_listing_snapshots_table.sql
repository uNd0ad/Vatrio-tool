-- Create historical snapshot table for what changed diffing

create table if not exists public.listing_snapshots (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  snapshot_data jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists listing_snapshots_listing_id_created_at_idx
  on public.listing_snapshots (listing_id, created_at desc);

create or replace function public.create_listing_snapshot()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.listing_snapshots (listing_id, snapshot_data)
  values (old.id, to_jsonb(old));
  return new;
end;
$$;

drop trigger if exists trigger_listing_snapshot on public.listings;

create trigger trigger_listing_snapshot
  before update on public.listings
  for each row
  execute function public.create_listing_snapshot();

alter table public.listing_snapshots enable row level security;

create policy "Allow read access to authenticated users for listing_snapshots"
  on public.listing_snapshots for select
  to authenticated
  using (true);

comment on table public.listing_snapshots is
  'Historical JSON snapshots recorded prior to each listing update for diff auditing.';

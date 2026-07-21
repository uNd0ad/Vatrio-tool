-- Function and trigger to auto-update updated_at timestamp on record updates

-- Coloana vine din baseline-ul legacy în producție; garantată aici pentru
-- mediile construite exclusiv din migrațiile CLI (ex. supabase db reset).
alter table public.listings
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trigger_set_listings_updated_at on public.listings;

create trigger trigger_set_listings_updated_at
  before update on public.listings
  for each row
  execute function public.set_updated_at_timestamp();

comment on function public.set_updated_at_timestamp is
  'Automatically sets updated_at to the current timestamp on row updates.';

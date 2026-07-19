-- Create PostgreSQL enum type for listing status

do $$
begin
  if not exists (select 1 from pg_type where typname = 'listing_status_enum') then
    create type public.listing_status_enum as enum ('new', 'contacted', 'refused', 'closed');
  end if;
end $$;

-- Enforce check constraint for listing status enum values
alter table public.listings
  add constraint listings_status_enum_check
  check (status in ('new', 'contacted', 'refused', 'closed'));

comment on constraint listings_status_enum_check on public.listings is
  'Ensures listing status strictly conforms to canonical status values.';

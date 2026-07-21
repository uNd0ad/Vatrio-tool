-- Create dedicated archived_listings table for long term archival storage

create table if not exists public.archived_listings (
  id uuid primary key,
  title text not null,
  price numeric,
  currency text default 'EUR',
  location text,
  surface_sqm numeric,
  rooms integer,
  url text not null,
  external_id text,
  source_portal text,
  property_type text,
  transaction_type text,
  seller_type text,
  status text,
  archived_at timestamptz not null default now(),
  original_created_at timestamptz
);

create index if not exists archived_listings_archived_at_idx
  on public.archived_listings (archived_at desc);

create or replace function public.move_deleted_listings_to_archive(days_threshold integer default 90)
returns integer
language plpgsql
security definer
as $$
declare
  archived_count integer;
begin
  -- Coloanele reale din listings: listing_url (nu url), date_scraped (nu
  -- created_at); rooms nu există pe listings, rămâne null în arhivă.
  with moved as (
    delete from public.listings
    where deleted_at is not null and deleted_at < now() - (days_threshold || ' days')::interval
    returning id, title, price, currency, location, surface_sqm, listing_url, external_id, source_portal, property_type, transaction_type, seller_type, status, date_scraped
  )
  insert into public.archived_listings (
    id, title, price, currency, location, surface_sqm, url, external_id, source_portal, property_type, transaction_type, seller_type, status, original_created_at
  )
  select
    id, title, price, currency, location, surface_sqm, listing_url, external_id, source_portal, property_type, transaction_type, seller_type, status, date_scraped
  from moved;

  get diagnostics archived_count = row_count;
  return archived_count;
end;
$$;

alter table public.archived_listings enable row level security;

create policy "Allow read access to authenticated users for archived_listings"
  on public.archived_listings for select
  to authenticated
  using (true);

comment on table public.archived_listings is
  'Long-term cold storage table for soft-deleted/expired listings.';

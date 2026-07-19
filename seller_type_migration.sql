-- Rulează o singură dată în Supabase SQL Editor.
alter table public.listings
  add column if not exists seller_type text
  check (seller_type in ('owner', 'agency', 'unknown'))
  default 'unknown';

create index if not exists idx_listings_seller_type
  on public.listings(seller_type);


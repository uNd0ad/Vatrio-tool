-- Create separate listing_photos table for multi-photo support per listing

create table if not exists public.listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  url text not null,
  display_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists listing_photos_listing_id_idx
  on public.listing_photos (listing_id, display_order);

alter table public.listing_photos enable row level security;

create policy "Allow read access to authenticated users for listing_photos"
  on public.listing_photos for select
  to authenticated
  using (true);

create policy "Allow service_role full access to listing_photos"
  on public.listing_photos for all
  to service_role
  using (true)
  with check (true);

comment on table public.listing_photos is
  'Stores individual photos associated with a real estate listing.';

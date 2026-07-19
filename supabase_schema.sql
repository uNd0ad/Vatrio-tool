-- Schema completă Supabase pentru Vatrio Tool — rulează în Supabase SQL Editor

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  price numeric check (price >= 0),
  currency text default 'EUR',
  location text,
  property_type text,
  surface_sqm numeric,
  image_url text,
  listing_url text not null unique,
  source text not null check (source in ('olx', 'storia', 'imobiliare', 'homezz', 'publi24')),
  seller_type text not null default 'unknown' check (seller_type in ('owner', 'agency', 'developer', 'unknown')),
  transaction_type text not null default 'sale' check (transaction_type in ('sale', 'rent')),
  date_scraped timestamptz not null default now(),
  days_on_market integer default 0 check (days_on_market >= 0),
  status text not null default 'new' check (status in ('new', 'contacted', 'refused', 'closed')),
  notes text,
  deleted_at timestamptz,
  last_seen_at timestamptz default now(),
  is_stale boolean default false,
  duplicate_of_id uuid references public.listings(id) on delete set null,
  latitude numeric check (latitude >= -90 and latitude <= 90),
  longitude numeric check (longitude >= -180 and longitude <= 180),
  source_portal text,
  crawl_run_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Adaugă coloanele opționale dacă tabelul a fost creat în versiuni anterioare
alter table public.listings add column if not exists deleted_at timestamptz;
alter table public.listings add column if not exists last_seen_at timestamptz default now();
alter table public.listings add column if not exists is_stale boolean default false;
alter table public.listings add column if not exists duplicate_of_id uuid references public.listings(id) on delete set null;
alter table public.listings add column if not exists latitude numeric check (latitude >= -90 and latitude <= 90);
alter table public.listings add column if not exists longitude numeric check (longitude >= -180 and longitude <= 180);
alter table public.listings add column if not exists source_portal text;
alter table public.listings add column if not exists crawl_run_id text;
alter table public.listings add column if not exists days_on_market integer default 0;
alter table public.listings add column if not exists updated_at timestamptz default now();

-- Indexuri pentru performanță
create index if not exists idx_listings_status on public.listings(status);
create index if not exists idx_listings_source on public.listings(source);
create index if not exists idx_listings_seller_type on public.listings(seller_type);
create index if not exists idx_listings_transaction_type on public.listings(transaction_type);
create index if not exists idx_listings_active_date_scraped on public.listings(date_scraped desc) where deleted_at is null;

-- Row Level Security
alter table public.listings enable row level security;

drop policy if exists "Allow read for authenticated users" on public.listings;
create policy "Allow read for authenticated users" on public.listings
  for select to authenticated using (true);

drop policy if exists "Allow updates for authenticated users" on public.listings;
create policy "Allow updates for authenticated users" on public.listings
  for update to authenticated using (true) with check (true);

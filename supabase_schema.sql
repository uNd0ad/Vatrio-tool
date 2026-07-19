-- Rulează asta în Supabase SQL Editor ca să creezi tabelul

create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  price numeric,
  currency text,
  location text,
  property_type text,
  surface_sqm numeric,
  image_url text,
  listing_url text not null unique,
  source text not null check (source in ('olx', 'storia', 'imobiliare')),
  seller_type text not null default 'unknown' check (seller_type in ('owner', 'agency', 'unknown')),
  transaction_type text not null default 'sale' check (transaction_type in ('sale', 'rent')),
  date_scraped timestamptz not null default now(),
  status text not null default 'new' check (status in ('new', 'contacted', 'refused', 'closed')),
  notes text
);

create index if not exists idx_listings_status on listings(status);
create index if not exists idx_listings_source on listings(source);
create index if not exists idx_listings_seller_type on listings(seller_type);
create index if not exists idx_listings_transaction_type on listings(transaction_type);

-- Row Level Security: aplicația desktop citește/actualizează cu anon key,
-- crawler-ul scrie cu service_role key (care ocolește RLS automat).
alter table listings enable row level security;

create policy "Allow read for authenticated users" on listings
  for select to authenticated using (true);

create policy "Allow updates for authenticated users" on listings
  for update to authenticated using (true) with check (true);

-- NU adăuga policy de insert pentru utilizatori — inserțiile vin doar din crawler (service_role).

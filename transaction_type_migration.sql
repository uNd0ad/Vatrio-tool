-- Rulează o singură dată în Supabase SQL Editor.
alter table public.listings
  add column if not exists transaction_type text not null
  default 'sale'
  check (transaction_type in ('sale', 'rent'));

create index if not exists idx_listings_transaction_type
  on public.listings(transaction_type);


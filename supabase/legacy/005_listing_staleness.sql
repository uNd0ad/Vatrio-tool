alter table public.listings
  add column if not exists last_seen_at timestamptz not null default now(),
  add column if not exists is_stale boolean not null default false;

create index if not exists listings_last_seen_at_idx on public.listings (last_seen_at);

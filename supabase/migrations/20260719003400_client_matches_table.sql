-- Create client_matches table linking property listings to saved client search profiles

create table if not exists public.client_matches (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null,
  listing_id uuid not null references public.listings(id) on delete cascade,
  match_score numeric check (match_score >= 0 and match_score <= 100),
  status text not null default 'unread' check (status in ('unread', 'read', 'archived', 'notified')),
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (client_id, listing_id)
);

create index if not exists client_matches_client_id_idx
  on public.client_matches (client_id, status);

create index if not exists client_matches_listing_id_idx
  on public.client_matches (listing_id);

alter table public.client_matches enable row level security;

create policy "Allow client read access to own matches"
  on public.client_matches for select
  to authenticated
  using (auth.uid() = client_id);

create policy "Allow service_role full access to client_matches"
  on public.client_matches for all
  to service_role
  using (true)
  with check (true);

comment on table public.client_matches is
  'Links listings to saved client buyer/renter search profiles.';

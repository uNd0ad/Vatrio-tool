create table if not exists public.crawler_site_runs (
  site text primary key check (site in ('olx', 'storia', 'imobiliare', 'homezz', 'publi24')),
  completed_at timestamptz not null,
  listing_count integer not null check (listing_count >= 0)
);

alter table public.crawler_site_runs enable row level security;

create policy "Authenticated users can read crawler site runs"
  on public.crawler_site_runs for select to authenticated using (true);

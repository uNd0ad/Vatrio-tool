create table if not exists public.crawler_runs (
  id uuid primary key default gen_random_uuid(),
  completed_at timestamptz not null default now(),
  listing_count integer not null check (listing_count >= 0)
);

alter table public.crawler_runs enable row level security;

create policy "Authenticated users can read crawler runs"
  on public.crawler_runs for select
  to authenticated
  using (true);

create index if not exists crawler_runs_completed_at_idx
  on public.crawler_runs (completed_at desc);

create table if not exists public.crawl_jobs (
  id uuid primary key default gen_random_uuid(),
  site text not null check (site in ('olx', 'storia', 'imobiliare', 'homezz', 'publi24')),
  search_url text not null,
  transaction_type text not null check (transaction_type in ('sale', 'rent')),
  label text not null default 'queued',
  status text not null default 'pending' check (status in ('pending', 'running', 'done', 'failed')),
  attempts integer not null default 0,
  worker_id text,
  available_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists crawl_jobs_claim_idx
  on public.crawl_jobs (status, available_at, created_at);

alter table public.crawl_jobs enable row level security;

create or replace function public.claim_crawl_job(claiming_worker_id text)
returns setof public.crawl_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed_id uuid;
begin
  select id into claimed_id
  from public.crawl_jobs
  where status = 'pending' and available_at <= now()
  order by created_at
  for update skip locked
  limit 1;

  if claimed_id is null then return; end if;

  return query
  update public.crawl_jobs
  set status = 'running', worker_id = claiming_worker_id,
      attempts = attempts + 1, started_at = now(), error_message = null
  where id = claimed_id
  returning *;
end;
$$;

revoke all on function public.claim_crawl_job(text) from public, anon, authenticated;
grant execute on function public.claim_crawl_job(text) to service_role;

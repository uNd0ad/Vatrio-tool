alter table public.listings
  add column if not exists deleted_at timestamptz;

create index if not exists listings_active_date_scraped_idx
  on public.listings (date_scraped desc)
  where deleted_at is null;

comment on column public.listings.deleted_at is
  'Soft-delete timestamp. Null means the listing is active and visible in normal queries.';

create or replace function public.soft_delete_listing(target_id uuid)
returns void
language sql
security invoker
set search_path = public
as $$
  update public.listings
  set deleted_at = now()
  where id = target_id and deleted_at is null;
$$;

create or replace function public.restore_listing(target_id uuid)
returns void
language sql
security invoker
set search_path = public
as $$
  update public.listings
  set deleted_at = null
  where id = target_id and deleted_at is not null;
$$;

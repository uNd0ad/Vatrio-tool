-- Auto-archive (soft-delete / close) listings that have been inactive for X months.

create or replace function public.archive_inactive_listings(
  inactive_months integer default 3
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_archived_count integer := 0;
  v_cutoff timestamptz;
begin
  if inactive_months < 1 then
    raise exception 'inactive_months must be at least 1';
  end if;

  v_cutoff := now() - (inactive_months || ' months')::interval;

  with updated as (
    update public.listings
    set
      status = 'closed',
      deleted_at = coalesce(deleted_at, now()),
      is_stale = true
    where last_seen_at < v_cutoff
      and (deleted_at is null or status != 'closed')
    returning id
  )
  select count(*) into v_archived_count from updated;

  return v_archived_count;
end;
$$;

comment on function public.archive_inactive_listings is 'Soft-deletes and marks closed any listings un-seen for inactive_months (default 3 months).';

create or replace function public.days_on_market(listing public.listings)
returns integer
language sql
stable
set search_path = public
as $$
  select greatest(
    0,
    floor(extract(epoch from (now() - listing.date_scraped)) / 86400)::integer
  );
$$;

comment on function public.days_on_market(public.listings) is
  'PostgREST computed field: whole days elapsed since the listing was first scraped.';

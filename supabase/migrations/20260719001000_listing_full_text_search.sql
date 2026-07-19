alter table public.listings
  add column if not exists search_vector tsvector
  generated always as (
    setweight(to_tsvector('romanian'::regconfig, coalesce(title, '')), 'A') ||
    setweight(to_tsvector('romanian'::regconfig, coalesce(location, '')), 'B')
  ) stored;

create index if not exists listings_search_vector_idx
  on public.listings using gin (search_vector);

comment on column public.listings.search_vector is
  'Romanian full-text document weighted toward title, with location/zone as secondary text.';

create or replace function public.search_active_listings(
  search_query text,
  result_limit integer default 50
)
returns setof public.listings
language sql
stable
security invoker
set search_path = public
as $$
  select listing.*
  from public.listings as listing
  where listing.deleted_at is null
    and listing.search_vector @@ websearch_to_tsquery('romanian'::regconfig, search_query)
  order by ts_rank(listing.search_vector, websearch_to_tsquery('romanian'::regconfig, search_query)) desc,
           listing.date_scraped desc
  limit least(greatest(coalesce(result_limit, 50), 1), 200);
$$;

comment on function public.search_active_listings(text, integer) is
  'Ranked full-text search over active listing titles and location/zone text.';

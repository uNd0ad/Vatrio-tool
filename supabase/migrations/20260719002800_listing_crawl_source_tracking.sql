-- Track crawl source portal and execution run ID per listing

alter table public.listings
  add column if not exists source_portal text,
  add column if not exists crawl_run_id uuid;

create index if not exists listings_source_portal_idx
  on public.listings (source_portal);

create index if not exists listings_crawl_run_id_idx
  on public.listings (crawl_run_id);

comment on column public.listings.source_portal is 'Original portal site (e.g. storia, imobiliare, olx).';
comment on column public.listings.crawl_run_id is 'UUID identifying the specific crawler execution run that scraped or last updated this listing.';

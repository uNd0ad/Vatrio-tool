alter table public.listings
  add column if not exists schema_version integer not null default 1;

alter table public.listings
  drop constraint if exists listings_schema_version_positive;

alter table public.listings
  add constraint listings_schema_version_positive check (schema_version > 0);

comment on column public.listings.schema_version is
  'Version of the crawler payload schema used when this listing was stored.';

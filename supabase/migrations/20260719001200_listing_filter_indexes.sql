create index if not exists listings_active_status_idx
  on public.listings (status)
  where deleted_at is null;

create index if not exists listings_active_location_idx
  on public.listings (lower(location))
  where deleted_at is null and location is not null;

create index if not exists listings_active_price_idx
  on public.listings (price)
  where deleted_at is null and price is not null;

create index if not exists listings_active_filter_covering_idx
  on public.listings (status, transaction_type, price, date_scraped desc)
  include (location)
  where deleted_at is null;

comment on index public.listings_active_filter_covering_idx is
  'Supports common active-listing filters while covering location/zone display.';

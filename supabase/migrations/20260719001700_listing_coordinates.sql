alter table public.listings
  add column if not exists latitude double precision check (latitude is null or (latitude >= -90 and latitude <= 90)),
  add column if not exists longitude double precision check (longitude is null or (longitude >= -180 and longitude <= 180));

create index if not exists listings_active_coordinates_idx
  on public.listings (latitude, longitude)
  where deleted_at is null and latitude is not null and longitude is not null;

comment on column public.listings.latitude is 'Geocoded WGS84 latitude coordinate for map positioning.';
comment on column public.listings.longitude is 'Geocoded WGS84 longitude coordinate for map positioning.';

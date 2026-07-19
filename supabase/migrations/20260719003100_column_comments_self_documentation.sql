-- Comprehensive column comments for database self-documentation

comment on table public.listings is 'Core table for real estate property listings aggregated across portals.';
comment on column public.listings.id is 'Surrogate primary key UUID.';
comment on column public.listings.title is 'Scraped listing title.';
comment on column public.listings.price is 'Listing monetary price value.';
comment on column public.listings.currency is 'Currency code (EUR, RON, USD, GBP).';
comment on column public.listings.location is 'Location text string or neighborhood.';
comment on column public.listings.surface_sqm is 'Usable area in square meters.';
comment on column public.listings.rooms is 'Total room count.';
comment on column public.listings.url is 'Canonical external portal URL.';
comment on column public.listings.external_id is 'Portal vendor external unique identifier.';
comment on column public.listings.property_type is 'Normalized property classification.';
comment on column public.listings.transaction_type is 'Normalized transaction type (sale or rent).';
comment on column public.listings.seller_type is 'Normalized seller entity type (owner, agency, developer).';
comment on column public.listings.status is 'Internal CRM status (new, contacted, refused, closed).';
comment on column public.listings.latitude is 'WGS84 latitude coordinate.';
comment on column public.listings.longitude is 'WGS84 longitude coordinate.';
comment on column public.listings.days_on_market is 'Calculated active days on market.';
comment on column public.listings.first_seen_at` is 'Timestamp when listing was first scraped.';
comment on column public.listings.last_seen_at` is 'Timestamp when listing was last verified online.';
comment on column public.listings.deleted_at` is 'Soft-deletion timestamp for inactive or expired listings.';

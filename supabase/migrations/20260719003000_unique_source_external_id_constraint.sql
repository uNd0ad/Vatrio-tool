-- Enforce database-level unique constraint on source portal and external ID for active listings

create unique index if not exists listings_source_portal_external_id_active_idx
  on public.listings (source_portal, external_id)
  where deleted_at is null and source_portal is not null and external_id is not null;

comment on index public.listings_source_portal_external_id_active_idx is
  'Ensures no duplicate active listings exist for the same source portal and external listing ID.';

alter table public.listings
  add column if not exists duplicate_of_id uuid
  references public.listings(id) on delete set null;

create index if not exists listings_duplicate_of_id_idx
  on public.listings (duplicate_of_id);

comment on column public.listings.duplicate_of_id is
  'Links a duplicate advertisement to its canonical listing.';

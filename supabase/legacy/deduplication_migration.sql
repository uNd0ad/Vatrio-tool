-- -------------------------------------------------------------
-- MIGRATION: add_duplicate_of_id_to_listings
-- Descriere: Adaugă coloana duplicate_of_id pentru a lega anunțurile
--            identice de pe platforme diferite sau agenții multiple.
-- -------------------------------------------------------------

alter table public.listings
  add column if not exists duplicate_of_id uuid references public.listings(id) on delete set null;

-- Index pentru filtrare rapidă după duplicate_of_id
create index if not exists idx_listings_duplicate_of_id on public.listings(duplicate_of_id);

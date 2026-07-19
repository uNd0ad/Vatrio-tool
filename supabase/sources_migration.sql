-- -------------------------------------------------------------
-- MIGRATION: update_listings_source_check
-- Descriere: Actualizează constrângerea de verificare pe coloana source
--            pentru a permite sursele 'homezz' și 'publi24'.
-- -------------------------------------------------------------

alter table public.listings
  drop constraint if exists listings_source_check;

alter table public.listings
  add constraint listings_source_check
  check (source in ('olx', 'storia', 'imobiliare', 'homezz', 'publi24'));

-- Permite 'developer' ca tip de vânzător.
--
-- Constrângerea aplicată în producție provine din legacy/seller_type_migration.sql
-- și acceptă doar ('owner', 'agency', 'unknown'). Între timp crawlerul
-- (classifySellerType) și tipul SellerType al aplicației produc și 'developer',
-- iar un singur anunț de dezvoltator oprea întreaga rulare de crawl cu
-- 23514 check_violation, pierzând toate anunțurile din lot.

alter table public.listings
  drop constraint if exists listings_seller_type_check;

alter table public.listings
  add constraint listings_seller_type_check
  check (seller_type in ('owner', 'agency', 'developer', 'unknown'));

comment on constraint listings_seller_type_check on public.listings is
  'Tipurile de vânzător recunoscute de crawler și de aplicație.';

-- Câmpurile produse de etapa de parsare a crawlerului (crawler → parser → db → ui).
--
-- `neighborhood` e cartierul canonic din `ListaCartiereTM.txt`, stabilit de
-- `crawler/src/parser` din locație, titlu și textul cardului. Rămâne null când
-- parserul nu poate decide (zonă ambiguă sau anunț din afara Timișoarei), ca UI-ul
-- să nu arate o încadrare inventată.

alter table public.listings add column if not exists neighborhood text;
alter table public.listings add column if not exists rooms integer;
alter table public.listings add column if not exists parse_warnings text[] not null default '{}';

alter table public.listings drop constraint if exists listings_rooms_plausible;
alter table public.listings
  add constraint listings_rooms_plausible check (rooms is null or (rooms > 0 and rooms <= 20));

-- Filtrul pe cartier din UI rulează pe anunțurile active, ca restul filtrelor.
create index if not exists idx_listings_active_neighborhood
  on public.listings (neighborhood)
  where deleted_at is null;

comment on column public.listings.neighborhood is
  'Canonical Timisoara neighborhood resolved by the crawler parser from ListaCartiereTM.txt; null when no confident match.';
comment on column public.listings.rooms is
  'Room count parsed from the listing title/card text (garsoniera counts as 1).';
comment on column public.listings.parse_warnings is
  'Stable parser warning slugs for this listing (e.g. neighborhood_unresolved, price_per_sqm), for data-quality triage.';

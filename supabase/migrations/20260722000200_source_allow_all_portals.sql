-- Permite toate portalurile crawl-uite ca sursă.
--
-- Constrângerea din producție a rămas la cele trei portaluri inițiale
-- ('olx', 'storia', 'imobiliare'); legacy/sources_migration.sql, care le adaugă
-- pe homezz și publi24, nu a fost aplicat niciodată pe acest proiect. Crawlerul
-- le parcurge de mult pe toate cinci, iar primul anunț de pe homezz oprea
-- întreaga rulare cu 23514 check_violation.
--
-- crawl_jobs.site și crawler_site_runs.site acceptau deja toate cinci; listings
-- era singura tabelă rămasă în urmă (verificat pe toate constrângerile din
-- schema public).

alter table public.listings
  drop constraint if exists listings_source_check;

alter table public.listings
  add constraint listings_source_check
  check (source in ('olx', 'storia', 'imobiliare', 'homezz', 'publi24'));

comment on constraint listings_source_check on public.listings is
  'Portalurile pe care le parcurge crawlerul; sincron cu SITE_CARD_SELECTORS.';

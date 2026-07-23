-- Permite utilizatorilor autentificați să vadă anunțurile șterse (coșul de gunoi).
--
-- Politica SELECT din 20260719001100 restrângea citirea la `deleted_at IS NULL`,
-- deci vederea „Șterse" (fetchDeletedListings, care cere `deleted_at IS NOT NULL`)
-- primea zero rânduri pentru un utilizator real — RLS le ascundea pe toate.
-- Ștergerea funcționa (rândul primea deleted_at), dar nu apărea niciodată în coș.
--
-- Toate interogările pentru listele active filtrează deja `deleted_at IS NULL`
-- în cod, deci lărgirea citirii nu expune anunțuri șterse în vederile normale.
-- Politica de UPDATE rămâne restrânsă la rândurile active, iar ștergerea și
-- restaurarea trec prin funcțiile SECURITY DEFINER, deci un utilizator tot nu
-- poate edita direct un anunț șters.

drop policy if exists listings_authenticated_read_active on public.listings;
drop policy if exists listings_authenticated_read_all on public.listings;

create policy listings_authenticated_read_all
  on public.listings for select to authenticated
  using (true);

comment on policy listings_authenticated_read_all on public.listings is
  'Citire completă pentru utilizatorii autentificați, inclusiv anunțurile șterse din coșul de gunoi; listele active filtrează deleted_at în cod.';

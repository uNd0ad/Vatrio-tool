-- Rulează acest fișier o singură dată în Supabase SQL Editor dacă tabelul
-- listings a fost creat deja folosind schema inițială cu acces anonim.

drop policy if exists "Allow read for anon" on listings;
drop policy if exists "Allow status/notes update for anon" on listings;
drop policy if exists "Allow read for authenticated users" on listings;
drop policy if exists "Allow updates for authenticated users" on listings;

create policy "Allow read for authenticated users" on listings
  for select to authenticated using (true);

create policy "Allow updates for authenticated users" on listings
  for update to authenticated using (true) with check (true);

-- Ștergere definitivă a anunțurilor soft-deleted mai vechi de 30 de zile.
--
-- Soft delete-ul pune doar `deleted_at`; rândul rămâne în baza de date la
-- nesfârșit. Aplicația are un „coș de gunoi" din care anunțurile pot fi
-- restaurate, iar după 30 de zile sunt șterse automat prin pg_cron.
-- Ștergerea propagă în cascadă la tabelele-copil (price_history, photos,
-- snapshots, tags, activity_logs), conform FK-urilor din 20260719002100.

create extension if not exists pg_cron;

-- Fereastra de retenție e configurabilă, ca celelalte, prin
-- data_retention_policies. Cheia e distinctă de un eventual retention pentru
-- rândurile active.
insert into public.data_retention_policies (table_name, retention_days)
values ('listings_soft_deleted', 30)
on conflict (table_name) do nothing;

create or replace function public.purge_expired_deleted_listings()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  purged integer;
  days integer;
begin
  select retention_days into days
  from public.data_retention_policies
  where table_name = 'listings_soft_deleted';
  if days is null then
    days := 30;
  end if;

  with removed as (
    delete from public.listings
    where deleted_at is not null
      and deleted_at < now() - (days || ' days')::interval
    returning id
  )
  select count(*) into purged from removed;
  return purged;
end;
$$;

comment on function public.purge_expired_deleted_listings is
  'Șterge definitiv anunțurile soft-deleted mai vechi decât fereastra din data_retention_policies (implicit 30 de zile).';

-- Programare zilnică la 03:15 UTC. cron.schedule cu același nume înlocuiește
-- programarea existentă, deci migrația e idempotentă la re-rulare.
do $$
begin
  perform cron.schedule(
    'purge-expired-deleted-listings',
    '15 3 * * *',
    'select public.purge_expired_deleted_listings();'
  );
exception when undefined_function or undefined_table then
  -- pg_cron nu e disponibil în mediul local (supabase db reset fără extensie):
  -- funcția rămâne și poate fi apelată manual, doar programarea lipsește.
  raise notice 'pg_cron indisponibil; programarea purjării a fost omisă.';
end $$;

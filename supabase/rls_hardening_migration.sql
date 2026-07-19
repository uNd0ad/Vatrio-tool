-- -------------------------------------------------------------
-- MIGRATION: hardening_listings_member_restrictions
-- Descriere: Restricționează membrii simpli să modifice alte coloane
--            în afară de 'status' și 'notes'. Crawler-ul și conturile
--            master au permisiuni depline.
-- -------------------------------------------------------------

-- 1. Creează funcția de verificare a permisiunilor la update
create or replace function public.check_listing_update_permissions()
returns trigger as $$
declare
  user_role public.app_role;
begin
  -- Dacă auth.uid() este NULL, înseamnă că cererea vine de la crawler/sistem (folosind service_role),
  -- caz în care permitem orice actualizare pe tabel.
  if auth.uid() is null then
    return NEW;
  end if;

  -- Obține rolul utilizatorului autentificat din tabela public.user_roles
  select role into user_role 
  from public.user_roles 
  where user_id = auth.uid();

  -- Dacă utilizatorul are rolul de 'member' (sau nu are rol setat), verificăm ce coloane s-au modificat
  if user_role is null or user_role = 'member'::public.app_role then
    if NEW.title is distinct from OLD.title or
       NEW.price is distinct from OLD.price or
       NEW.currency is distinct from OLD.currency or
       NEW.location is distinct from OLD.location or
       NEW.property_type is distinct from OLD.property_type or
       NEW.surface_sqm is distinct from OLD.surface_sqm or
       NEW.image_url is distinct from OLD.image_url or
       NEW.listing_url is distinct from OLD.listing_url or
       NEW.source is distinct from OLD.source or
       NEW.seller_type is distinct from OLD.seller_type or
       NEW.transaction_type is distinct from OLD.transaction_type or
       NEW.date_scraped is distinct from OLD.date_scraped
    then
      raise exception 'Membrii simpli pot modifica doar statusul și notițele interne.';
    end if;
  end if;

  return NEW;
end;
$$ language plpgsql security definer;

-- 2. Înregistrează trigger-ul pe tabela listings
drop trigger if exists tr_check_listing_update_permissions on public.listings;

create trigger tr_check_listing_update_permissions
  before update on public.listings
  for each row
  execute function public.check_listing_update_permissions();

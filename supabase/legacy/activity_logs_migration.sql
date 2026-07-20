-- -------------------------------------------------------------
-- MIGRATION: create_listing_activity_logs
-- Descriere: Creează tabela de audit pentru istoricul acțiunilor
--            utilizatorilor pe anunțuri (schimbare status, notițe).
-- -------------------------------------------------------------

create table if not exists public.listing_activity_logs (
    id uuid primary key default gen_random_uuid(),
    listing_id uuid not null references public.listings(id) on delete cascade,
    user_id uuid references auth.users(id) on delete set null,
    user_email text not null,
    action text not null,
    old_value text,
    new_value text,
    created_at timestamptz not null default now()
);

-- Index pentru interogare rapidă după listing_id
create index if not exists idx_activity_logs_listing_id on public.listing_activity_logs(listing_id);

-- Securitate RLS
alter table public.listing_activity_logs enable row level security;

-- Permite citirea tuturor jurnalelor de activitate de către utilizatorii autentificați
create policy "Utilizatorii autentificați pot citi jurnalele de activitate"
    on public.listing_activity_logs for select
    to authenticated
    using (true);

-- Permite adăugarea de jurnale de activitate de către utilizatorii autentificați
create policy "Utilizatorii autentificați pot adăuga jurnale de activitate"
    on public.listing_activity_logs for insert
    to authenticated
    with check (auth.uid() = user_id or auth.uid() is not null);

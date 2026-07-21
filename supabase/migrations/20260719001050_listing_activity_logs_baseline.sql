-- Baseline lipsă: legacy/activity_logs_migration.sql nu a fost aplicat manual
-- pe acest proiect Supabase, iar 20260719001100 (RLS explicit) presupune că
-- tabelul listing_activity_logs există. Se recreează aici, idempotent.
-- Politicile canonice de acces sunt definite în 20260719001100.

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

create index if not exists idx_activity_logs_listing_id
  on public.listing_activity_logs(listing_id);

alter table public.listing_activity_logs enable row level security;

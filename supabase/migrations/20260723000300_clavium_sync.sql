-- Starea sincronizării bidirecționale cu platforma Clavium.
--
-- Câte un rând per anunț care participă la sincronizare. Ține ambele sensuri:
--   • ieșire  — anunțul a fost trimis la Clavium (clavium_id, status, pushed_at)
--   • intrare — ce a întors Clavium despre el (clavium_data: potriviri cu clienți,
--               interes, status pe platformă), completat de pasul de „pull".
--
-- Conectarea la API-ul real Clavium se face în Edge Function-ul `clavium-sync`;
-- până când API-ul există, tabelul rămâne gol, iar funcția răspunde explicit că
-- integrarea nu e configurată. Vezi docs/CLAVIUM_INTEGRATION.md pentru contract.

create table if not exists public.clavium_sync (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  clavium_id text,
  status text not null default 'pending'
    check (status in ('pending', 'synced', 'failed', 'matched', 'removed')),
  -- hash-ul ultimului payload trimis; se retrimite doar când se schimbă.
  payload_hash text,
  -- date întoarse de Clavium (potriviri client, interes) — sensul de intrare.
  clavium_data jsonb,
  error text,
  pushed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists clavium_sync_status_idx on public.clavium_sync (status);

-- Reutilizează triggerul de updated_at definit în 20260719002600.
drop trigger if exists trigger_set_clavium_sync_updated_at on public.clavium_sync;
create trigger trigger_set_clavium_sync_updated_at
  before update on public.clavium_sync
  for each row
  execute function public.set_updated_at_timestamp();

alter table public.clavium_sync enable row level security;

-- Utilizatorii autentificați văd starea (ca s-o afișeze lângă anunț); scrierile
-- vin exclusiv din Edge Function, cu service_role.
drop policy if exists clavium_sync_authenticated_read on public.clavium_sync;
create policy clavium_sync_authenticated_read
  on public.clavium_sync for select to authenticated using (true);

drop policy if exists clavium_sync_service_write on public.clavium_sync;
create policy clavium_sync_service_write
  on public.clavium_sync for all to service_role using (true) with check (true);

comment on table public.clavium_sync is
  'Stare de sincronizare bidirecțională între anunțuri și platforma Clavium.';

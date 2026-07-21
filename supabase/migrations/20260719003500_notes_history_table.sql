-- Create notes_history table and trigger to preserve complete editing history of user notes

create table if not exists public.notes_history (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  previous_note text not null,
  edited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists notes_history_listing_id_idx
  on public.notes_history (listing_id, created_at desc);

-- Notițele trăiesc pe coloana listings.notes (adăugată în 20260719001500), nu
-- într-un tabel separat listing_notes — triggerul ascultă acea coloană.
create or replace function public.create_note_history_entry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.notes is distinct from new.notes and old.notes is not null then
    insert into public.notes_history (listing_id, previous_note, edited_by)
    values (old.id, old.notes, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists trigger_note_history on public.listings;

create trigger trigger_note_history
  before update of notes on public.listings
  for each row
  execute function public.create_note_history_entry();

alter table public.notes_history enable row level security;

drop policy if exists "Allow read access to authenticated users for notes_history" on public.notes_history;
create policy "Allow read access to authenticated users for notes_history"
  on public.notes_history for select
  to authenticated
  using (true);

comment on table public.notes_history is
  'Historical log of previous note contents prior to user updates.';

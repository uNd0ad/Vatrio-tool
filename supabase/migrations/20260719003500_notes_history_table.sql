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

create or replace function public.create_note_history_entry()
returns trigger
language plpgsql
security definer
as $$
begin
  if old.note is distinct from new.note and old.note is not null then
    insert into public.notes_history (listing_id, previous_note, edited_by)
    values (old.listing_id, old.note, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists trigger_note_history on public.listing_notes;

create trigger trigger_note_history
  before update on public.listing_notes
  for each row
  execute function public.create_note_history_entry();

alter table public.notes_history enable row level security;

create policy "Allow read access to authenticated users for notes_history"
  on public.notes_history for select
  to authenticated
  using (true);

comment on table public.notes_history is
  'Historical log of previous note contents prior to user updates.';

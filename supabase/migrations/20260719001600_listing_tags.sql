create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 40),
  normalized_name text generated always as (lower(trim(name))) stored,
  color text not null default '#64748b' check (color ~ '^#[0-9a-fA-F]{6}$'),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (normalized_name)
);

create table if not exists public.listing_tags (
  listing_id uuid not null references public.listings(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  added_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (listing_id, tag_id)
);

create index if not exists listing_tags_tag_listing_idx
  on public.listing_tags (tag_id, listing_id);

alter table public.tags enable row level security;
alter table public.listing_tags enable row level security;

create policy tags_authenticated_read
  on public.tags for select to authenticated using (true);
create policy tags_authenticated_insert
  on public.tags for insert to authenticated
  with check (created_by = auth.uid());
create policy tags_authenticated_update_own
  on public.tags for update to authenticated
  using (created_by = auth.uid()) with check (created_by = auth.uid());

create policy listing_tags_authenticated_read
  on public.listing_tags for select to authenticated using (true);
create policy listing_tags_authenticated_insert
  on public.listing_tags for insert to authenticated
  with check (added_by = auth.uid());
create policy listing_tags_authenticated_delete_own
  on public.listing_tags for delete to authenticated
  using (added_by = auth.uid());

comment on table public.tags is 'Reusable, normalized labels for organizing listings.';
comment on table public.listing_tags is 'Many-to-many listing label assignments with actor attribution.';

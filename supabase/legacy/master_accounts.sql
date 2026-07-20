-- Rulează în Supabase SQL Editor după supabase_auth_migration.sql.

create type public.app_role as enum ('master', 'member');

create table public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'member',
  created_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;

create policy "Users can read their own role" on public.user_roles
  for select to authenticated
  using (user_id = auth.uid());

-- Înlocuiește emailul și rulează o singură dată pentru primul cont master.
insert into public.user_roles (user_id, role)
select id, 'master'::public.app_role
from auth.users
where email = 'MASTER_EMAIL_HERE'
on conflict (user_id) do update set role = excluded.role;


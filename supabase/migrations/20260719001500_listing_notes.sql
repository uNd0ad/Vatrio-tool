alter table public.listings
  add column if not exists notes text;

comment on column public.listings.notes is
  'Internal free-text notes maintained by authenticated Vatrio users.';

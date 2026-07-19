-- Explicit audit and review of foreign key constraints and cascade delete/set-null behavior.

do $$
begin
  -- Ensure listing_price_history cascades on listing deletion
  if exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'listing_price_history_listing_id_fkey'
      and table_name = 'listing_price_history'
  ) then
    alter table public.listing_price_history
      drop constraint listing_price_history_listing_id_fkey;
  end if;
end $$;

alter table public.listing_price_history
  add constraint listing_price_history_listing_id_fkey
  foreign key (listing_id)
  references public.listings(id)
  on delete cascade;

-- Ensure listing_activity_logs foreign keys cascade on listing deletion and set null on user deletion
do $$
begin
  if exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'listing_activity_logs_listing_id_fkey'
      and table_name = 'listing_activity_logs'
  ) then
    alter table public.listing_activity_logs
      drop constraint listing_activity_logs_listing_id_fkey;
  end if;

  if exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'listing_activity_logs_user_id_fkey'
      and table_name = 'listing_activity_logs'
  ) then
    alter table public.listing_activity_logs
      drop constraint listing_activity_logs_user_id_fkey;
  end if;
end $$;

alter table public.listing_activity_logs
  add constraint listing_activity_logs_listing_id_fkey
  foreign key (listing_id)
  references public.listings(id)
  on delete cascade;

alter table public.listing_activity_logs
  add constraint listing_activity_logs_user_id_fkey
  foreign key (user_id)
  references auth.users(id)
  on delete set null;

comment on constraint listing_price_history_listing_id_fkey on public.listing_price_history is
  'Cascades price history cleanup when parent listing is hard deleted.';
comment on constraint listing_activity_logs_listing_id_fkey on public.listing_activity_logs is
  'Cascades activity log cleanup when parent listing is hard deleted.';
comment on constraint listing_activity_logs_user_id_fkey on public.listing_activity_logs is
  'Preserves activity records with null actor reference if user account is removed.';

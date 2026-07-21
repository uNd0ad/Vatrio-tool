-- Enforce non-negative price check constraints

-- Guarded: producția poate avea deja constrângerea (aplicare manuală pre-CLI).
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'listings_price_non_negative_check'
      and conrelid = 'public.listings'::regclass
  ) then
    alter table public.listings
      add constraint listings_price_non_negative_check
      check (price is null or price >= 0);
  end if;
end $$;

-- Istoria de preț (20260719000700) are o singură coloană `price`, nu
-- old_price/new_price — constrângerea reflectă schema reală.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'listing_price_history_price_non_negative_check'
      and conrelid = 'public.listing_price_history'::regclass
  ) then
    alter table public.listing_price_history
      add constraint listing_price_history_price_non_negative_check
      check (price is null or price >= 0);
  end if;
end $$;

comment on constraint listings_price_non_negative_check on public.listings is
  'Prevents negative prices from being saved to the database.';

-- Enforce non-negative price check constraints

alter table public.listings
  add constraint listings_price_non_negative_check
  check (price is null or price >= 0);

alter table public.listing_price_history
  add constraint listing_price_history_old_price_non_negative_check
  check (old_price is null or old_price >= 0),
  add constraint listing_price_history_new_price_non_negative_check
  check (new_price >= 0);

comment on constraint listings_price_non_negative_check on public.listings is
  'Prevents negative prices from being saved to the database.';

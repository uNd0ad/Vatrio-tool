-- Function and trigger to auto-update updated_at timestamp on record updates

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trigger_set_listings_updated_at on public.listings;

create trigger trigger_set_listings_updated_at
  before update on public.listings
  for each row
  execute function public.set_updated_at_timestamp();

comment on function public.set_updated_at_timestamp is
  'Automatically sets updated_at to the current timestamp on row updates.';

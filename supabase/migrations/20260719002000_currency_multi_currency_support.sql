-- Ensure currency column defaults to 'EUR' and supports common currencies ('EUR', 'RON', 'USD', 'GBP')

alter table public.listings
  alter column currency set default 'EUR';

-- Guarded: producția poate avea deja constrângerea (aplicare manuală pre-CLI).
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'listings_currency_check'
      and conrelid = 'public.listings'::regclass
  ) then
    alter table public.listings
      add constraint listings_currency_check
      check (currency is null or currency in ('EUR', 'RON', 'USD', 'GBP'));
  end if;
end $$;

create index if not exists listings_currency_idx
  on public.listings (currency)
  where deleted_at is null;

-- Conversion helper function for multi-currency reporting (base rates relative to EUR)
create or replace function public.convert_price_currency(
  p_amount numeric,
  p_from_currency text default 'EUR',
  p_to_currency text default 'EUR'
)
returns numeric
language plpgsql
immutable
as $$
declare
  v_from_rate numeric;
  v_to_rate numeric;
begin
  if p_amount is null then
    return null;
  end if;

  if upper(p_from_currency) = upper(p_to_currency) then
    return p_amount;
  end if;

  v_from_rate := case upper(coalesce(p_from_currency, 'EUR'))
    when 'EUR' then 1.0
    when 'RON' then 0.20 -- 1 RON ~ 0.20 EUR
    when 'USD' then 0.92 -- 1 USD ~ 0.92 EUR
    when 'GBP' then 1.18 -- 1 GBP ~ 1.18 EUR
    else 1.0
  end;

  v_to_rate := case upper(coalesce(p_to_currency, 'EUR'))
    when 'EUR' then 1.0
    when 'RON' then 0.20
    when 'USD' then 0.92
    when 'GBP' then 1.18
    else 1.0
  end;

  return round((p_amount * v_from_rate) / v_to_rate, 2);
end;
$$;

comment on column public.listings.currency is 'ISO 4217 currency code (EUR default, RON, USD, GBP supported).';
comment on function public.convert_price_currency is 'Converts price amount between supported ISO currency codes.';

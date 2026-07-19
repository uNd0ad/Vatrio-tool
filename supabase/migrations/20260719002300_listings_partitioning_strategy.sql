-- Declarative range partitioning strategy and automated partition manager for high-volume listings.

-- Helper procedure to dynamically generate range partitions by year and month
create or replace function public.create_listing_partition_for_month(
  p_year integer,
  p_month integer
)
returns text
language plpgsql
security definer
as $$
declare
  v_partition_name text;
  v_start_date date;
  v_end_date date;
  v_sql text;
begin
  if p_month < 1 or p_month > 12 then
    raise exception 'Invalid month %: must be between 1 and 12', p_month;
  end if;

  v_partition_name := format('listings_y%s_m%s', p_year, lpad(p_month::text, 2, '0'));
  v_start_date := make_date(p_year, p_month, 1);
  v_end_date := v_start_date + interval '1 month';

  v_sql := format(
    'create table if not exists public.%I (
       check (date_scraped >= %L and date_scraped < %L)
     ) inherits (public.listings);',
    v_partition_name,
    v_start_date,
    v_end_date
  );

  execute v_sql;
  return v_partition_name;
end;
$$;

comment on function public.create_listing_partition_for_month is 'Generates child range partition table for scale out storage when listings table exceeds volume limits.';

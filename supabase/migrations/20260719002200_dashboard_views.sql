-- Dashboard summary view and materialized view for fast visual analytics

create or replace view public.v_dashboard_summary as
select
  count(*) filter (where deleted_at is null) as total_active_listings,
  count(*) filter (where deleted_at is null and status = 'new') as count_new,
  count(*) filter (where deleted_at is null and status = 'contacted') as count_contacted,
  count(*) filter (where deleted_at is null and status = 'refused') as count_refused,
  count(*) filter (where deleted_at is null and status = 'closed') as count_closed,
  count(*) filter (where deleted_at is null and transaction_type = 'sale') as count_sale,
  count(*) filter (where deleted_at is null and transaction_type = 'rent') as count_rent,
  count(*) filter (where deleted_at is null and date_scraped >= date_trunc('day', now())) as count_added_today,
  round(avg(price) filter (where deleted_at is null and price > 0), 2) as avg_price,
  round(avg(surface_sqm) filter (where deleted_at is null and surface_sqm > 0), 2) as avg_surface_sqm
from public.listings;

-- Materialized view for fast city and transaction type analytics
create materialized view if not exists public.mv_city_analytics as
select
  lower(trim(coalesce(location, 'Unknown'))) as normalized_location,
  transaction_type,
  seller_type,
  count(*) as total_listings,
  count(*) filter (where status = 'new') as new_listings,
  round(avg(price), 2) as avg_price,
  min(price) as min_price,
  max(price) as max_price,
  round(avg(case when surface_sqm > 0 then price / surface_sqm else null end), 2) as avg_price_per_sqm
from public.listings
where deleted_at is null
group by lower(trim(coalesce(location, 'Unknown'))), transaction_type, seller_type;

create unique index if not exists mv_city_analytics_idx
  on public.mv_city_analytics (normalized_location, transaction_type, seller_type);

-- Function to refresh the materialized view
create or replace function public.refresh_city_analytics()
returns void
language plpgsql
security definer
as $$
begin
  refresh materialized view concurrently public.mv_city_analytics;
end;
$$;

alter view public.v_dashboard_summary owner to postgres;
grant select on public.v_dashboard_summary to authenticated;
grant select on public.mv_city_analytics to authenticated;

comment on view public.v_dashboard_summary is 'High-level real-time summary statistics for desktop dashboard.';
comment on materialized view public.mv_city_analytics is 'Pre-aggregated city, seller type, and transaction metrics for visual analytics.';
comment on function public.refresh_city_analytics is 'Concurrently refreshes the mv_city_analytics materialized view.';

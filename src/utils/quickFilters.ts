import { Listing } from '../types';

export type QuickFilterType = 'all' | 'new_today' | 'price_dropped' | 'below_average';

export function applyQuickFilter(listings: Listing[], filter: QuickFilterType): Listing[] {
  if (filter === 'all') return listings;

  if (filter === 'new_today') {
    const todayStr = new Date().toISOString().slice(0, 10);
    return listings.filter((l) => l.date_scraped && l.date_scraped.slice(0, 10) === todayStr);
  }

  if (filter === 'price_dropped') {
    return listings.filter((l) => l.price_history && l.price_history.length > 1);
  }

  if (filter === 'below_average') {
    const validPrices = listings.filter((l) => l.price != null && l.surface_sqm != null && l.surface_sqm > 0);
    if (validPrices.length === 0) return listings;
    const avgSqmPrice =
      validPrices.reduce((sum, l) => sum + (l.price! / l.surface_sqm!), 0) / validPrices.length;
    return listings.filter((l) => l.price != null && l.surface_sqm != null && l.price / l.surface_sqm < avgSqmPrice);
  }

  return listings;
}

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
    // Media se calculează în interiorul aceluiași tip de tranzacție. Comparată
    // cu o medie care amestecă vânzări și chirii, orice chirie ieșea „sub
    // medie" și aproape nicio vânzare — filtrul nu selecta nimic util.
    const rate = (l: Listing) => l.price! / l.surface_sqm!;
    const comparable = (l: Listing) => l.price != null && l.surface_sqm != null && l.surface_sqm > 0;

    const averageByType = new Map<Listing['transaction_type'], number>();
    for (const type of ['sale', 'rent'] as const) {
      const group = listings.filter((l) => l.transaction_type === type && comparable(l));
      if (group.length > 0) {
        averageByType.set(type, group.reduce((sum, l) => sum + rate(l), 0) / group.length);
      }
    }
    if (averageByType.size === 0) return listings;

    return listings.filter((l) => {
      const average = averageByType.get(l.transaction_type);
      return average !== undefined && comparable(l) && rate(l) < average;
    });
  }

  return listings;
}

import { Listing } from '../types';

export interface SortRule {
  field: keyof Listing;
  direction: 'asc' | 'desc';
}

export function sortListingsMultiColumn(listings: Listing[], rules: SortRule[]): Listing[] {
  if (rules.length === 0) return listings;

  return [...listings].sort((a, b) => {
    for (const rule of rules) {
      const valA = a[rule.field];
      const valB = b[rule.field];

      if (valA === valB) continue;
      if (valA == null) return 1;
      if (valB == null) return -1;

      let cmp = 0;
      if (typeof valA === 'number' && typeof valB === 'number') {
        cmp = valA - valB;
      } else {
        cmp = String(valA).localeCompare(String(valB), 'ro-RO');
      }

      if (cmp !== 0) {
        return rule.direction === 'asc' ? cmp : -cmp;
      }
    }
    return 0;
  });
}

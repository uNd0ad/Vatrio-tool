import { Listing } from '../types';

export type SortField = 'price' | 'date_scraped' | 'status' | 'title' | 'surface_sqm';
export type SortOrder = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  order: SortOrder;
}

export function sortListings(listings: Listing[], config: SortConfig): Listing[] {
  const { field, order } = config;
  const direction = order === 'asc' ? 1 : -1;

  return [...listings].sort((a, b) => {
    const valA = a[field];
    const valB = b[field];

    if (valA == null && valB == null) return 0;
    if (valA == null) return 1;
    if (valB == null) return -1;

    if (field === 'price' || field === 'surface_sqm') {
      return ((valA as number) - (valB as number)) * direction;
    }

    if (field === 'date_scraped') {
      return (new Date(valA as string).getTime() - new Date(valB as string).getTime()) * direction;
    }

    return String(valA).localeCompare(String(valB)) * direction;
  });
}

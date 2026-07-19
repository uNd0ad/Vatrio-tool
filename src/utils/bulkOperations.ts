import { Listing, ListingStatus } from '../types';

export function bulkUpdateStatus(
  listings: Listing[],
  targetIds: string[],
  newStatus: ListingStatus
): Listing[] {
  const idSet = new Set(targetIds);
  return listings.map((l) => (idSet.has(l.id) ? { ...l, status: newStatus } : l));
}

export function bulkDeleteListings(listings: Listing[], targetIds: string[]): Listing[] {
  const idSet = new Set(targetIds);
  return listings.filter((l) => !idSet.has(l.id));
}

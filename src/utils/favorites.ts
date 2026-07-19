const FAVORITES_KEY = 'vatrio_starred_listings_v1';

export function getStarredListingIds(): Set<string> {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function toggleStarredListing(listingId: string): boolean {
  const set = getStarredListingIds();
  const isStarredNow = !set.has(listingId);
  if (isStarredNow) {
    set.add(listingId);
  } else {
    set.delete(listingId);
  }
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // Ignore storage errors
  }
  return isStarredNow;
}

export function isListingStarred(listingId: string): boolean {
  return getStarredListingIds().has(listingId);
}

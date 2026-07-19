export interface DataQualityIssue {
  listingId: string;
  url: string;
  rule: 'missing_location' | 'missing_surface' | 'invalid_price' | 'missing_external_id';
  details: string;
}

export function auditListingQuality(listing: {
  id: string;
  url: string;
  location?: string | null;
  surface_sqm?: number | null;
  price?: number | null;
  external_id?: string | null;
}): DataQualityIssue[] {
  const issues: DataQualityIssue[] = [];

  if (!listing.location || listing.location.trim() === '') {
    issues.push({ listingId: listing.id, url: listing.url, rule: 'missing_location', details: 'Location field is empty or missing' });
  }

  if (listing.surface_sqm === null || listing.surface_sqm === undefined || listing.surface_sqm <= 0) {
    issues.push({ listingId: listing.id, url: listing.url, rule: 'missing_surface', details: 'Surface sqm is non-positive or missing' });
  }

  if (listing.price !== null && listing.price !== undefined && (listing.price < 50 || listing.price > 10_000_000)) {
    issues.push({ listingId: listing.id, url: listing.url, rule: 'invalid_price', details: `Price ${listing.price} is outside plausible bounds (50 - 10M)` });
  }

  if (!listing.external_id || listing.external_id.trim() === '') {
    issues.push({ listingId: listing.id, url: listing.url, rule: 'missing_external_id', details: 'External vendor ID is missing' });
  }

  return issues;
}

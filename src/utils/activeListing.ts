export function isActiveListing(listing: { deleted_at?: string | null }): boolean {
  return listing.deleted_at == null;
}

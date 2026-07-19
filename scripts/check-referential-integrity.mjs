export function checkReferentialIntegrity(records = {}) {
  const { listings = [], priceHistory = [], photos = [], snapshots = [] } = records;
  const validIds = new Set(listings.map((l) => l.id));
  const orphans = {
    priceHistory: priceHistory.filter((p) => !validIds.has(p.listing_id)),
    photos: photos.filter((p) => !validIds.has(p.listing_id)),
    snapshots: snapshots.filter((s) => !validIds.has(s.listing_id)),
  };

  const totalOrphans = orphans.priceHistory.length + orphans.photos.length + orphans.snapshots.length;
  return {
    valid: totalOrphans === 0,
    totalOrphans,
    orphans,
  };
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  console.log('[Integrity Check] Running database referential integrity scan...');
  const res = checkReferentialIntegrity();
  console.log(`[Integrity Check] Completed: ${res.totalOrphans} orphaned records found.`);
}

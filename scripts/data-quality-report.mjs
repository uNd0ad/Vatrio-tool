import { auditListingQuality } from '../crawler/dist/dataQualityReport.js';

export function runDataQualityReport(listings = []) {
  const issues = listings.flatMap(auditListingQuality);
  return {
    scannedListings: listings.length,
    issuesCount: issues.length,
    issues,
  };
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  console.log('[Data Quality] Running nightly data quality audit report...');
  const res = runDataQualityReport();
  console.log(`[Data Quality] Scanned ${res.scannedListings} listings, found ${res.issuesCount} flags.`);
}

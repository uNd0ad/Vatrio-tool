import { crawlLogger } from "./logger";
import { summarizeParse, type ParsedListing } from "./parser";

/**
 * Raportează ce a făcut parserul cu un lot de anunțuri, în consolă și în jurnal.
 *
 * Cartierele nerezolvate sunt afișate explicit: sunt singurul semnal că lista
 * din `ListaCartiereTM.txt` sau aliasurile din parser au nevoie de o completare.
 */
export function logParseSummary(
  context: { site: string; label?: string },
  listings: ParsedListing[]
): void {
  if (listings.length === 0) return;
  const summary = summarizeParse(listings);
  const scope = context.label ? `${context.site} ${context.label}` : context.site;
  const topZones = summary.byNeighborhood
    .slice(0, 3)
    .map(([name, count]) => `${name} (${count})`)
    .join(", ");

  console.log(
    `[Parser] ${scope}: ${summary.withNeighborhood}/${summary.total} anunțuri încadrate pe cartier` +
    (topZones ? `; cele mai multe în ${topZones}.` : ".")
  );
  if (summary.unresolvedLocations.length > 0) {
    console.log(`[Parser] Locații neîncadrate: ${summary.unresolvedLocations.join(" | ")}`);
  }

  crawlLogger.log("parse_completed", {
    site: context.site,
    label: context.label,
    total: summary.total,
    with_neighborhood: summary.withNeighborhood,
    warnings: Object.fromEntries(summary.warningCounts),
    unresolved_locations: summary.unresolvedLocations,
  });
}

import { backfillMissingCoordinates } from "./db";

/**
 * Rulare punctuală a completării de coordonate (`npm run backfill:coords`),
 * pentru cazurile în care nu vrei să aștepți următorul crawl programat.
 */
async function main() {
  let total = 0;
  // Backfill-ul procesează un lot pe apel; repetăm până nu mai rămâne nimic.
  for (;;) {
    const updated = await backfillMissingCoordinates();
    total += updated;
    if (updated === 0) break;
  }
  console.log(`[Geocoding] Gata: ${total} anunțuri au primit coordonate.`);
}

main().catch((err) => {
  console.error("Backfill-ul de coordonate a eșuat:", err);
  process.exit(1);
});

import { backfillParserFields } from "./db";

const BATCH_SIZE = 500;

/**
 * Rulare punctuală a completării de cartiere (`npm run backfill:cartiere`),
 * utilă imediat după aplicarea migrației `20260725000100_listing_parser_fields`:
 * altfel anunțurile deja existente ar aștepta următorul crawl.
 *
 * Avansează cu offset prin tot tabelul, pentru că anunțurile pe care parserul nu
 * le poate încadra rămân fără cartier și ar bloca la nesfârșit un filtru simplu.
 */
async function main() {
  let offset = 0;
  let total = 0;
  for (;;) {
    const { examined, updated } = await backfillParserFields(BATCH_SIZE, offset);
    total += updated;
    if (examined < BATCH_SIZE) break;
    // Rândurile actualizate ies din rezultatul următor (au deja cartier), deci
    // offsetul avansează doar cu cele rămase neîncadrate.
    offset += examined - updated;
  }
  console.log(`[Parser] Gata: ${total} anunțuri au primit cartier.`);
}

main().catch((err) => {
  console.error("Backfill-ul de cartiere a eșuat:", err);
  process.exit(1);
});

import { backfillMissingImages } from "./backfillImages";

async function main() {
  const { updated, skipped } = await backfillMissingImages();
  console.log(`[Images] Total: ${updated} completate, ${skipped} sărite.`);
}

main().catch((err) => {
  console.error("Backfill-ul de imagini a eșuat:", err);
  process.exit(1);
});

import { backfillHomezzPhotos } from "./backfillImages";

backfillHomezzPhotos()
  .then((r) => console.log(`[Images/homezz] Total: ${r.updated} corectate, ${r.skipped} sărite.`))
  .catch((err) => { console.error("Backfill-ul homezz a eșuat:", err); process.exit(1); });

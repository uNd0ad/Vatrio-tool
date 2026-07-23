import { supabase } from "./db";
import { crawlerRobotsGuard } from "./robots";

/**
 * Completează poza anunțurilor scrise fără `image_url`. Rândurile colectate cu
 * versiunea veche a scraperelor (care pierdea pozele — vezi fix-ul de headere
 * și `networkidle`) nu le primesc retroactiv, pentru că upsert-ul folosește
 * `ignoreDuplicates`. Aici recuperăm poza din meta-tagul `og:image` al paginii
 * sursă, care pentru OLX și Storia (unde sunt aproape toate cele lipsă) este
 * fotografia reală a anunțului.
 *
 * Rulare punctuală: `npm run backfill:images`. Procesează doar rândurile cu
 * `image_url` null, deci e reluabil — o a doua rulare continuă de unde a rămas.
 */

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

// og:image-ul unor portaluri e o siglă sau o imagine implicită când anunțul nu
// are poză proprie; astea nu trebuie salvate ca fotografie a anunțului.
const PLACEHOLDER_MARKERS = [
  "no_thumbnail",
  "default-og",
  "default_og",
  "/logo",
  "-logo",
  "placeholder",
];

export function extractOgImage(html: string): string | null {
  const match =
    html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  return match ? match[1] : null;
}

export function isUsableImage(url: string | null): url is string {
  if (!url || !url.startsWith("http")) return false;
  const lower = url.toLowerCase();
  if (lower.endsWith(".svg")) return false; // siglele portalurilor sunt SVG
  return !PLACEHOLDER_MARKERS.some((marker) => lower.includes(marker));
}

async function fetchOgImage(listingUrl: string): Promise<string | null> {
  // beforeNavigate respectă robots.txt și impune rate limiting per domeniu.
  await crawlerRobotsGuard.beforeNavigate(listingUrl);
  const response = await fetch(listingUrl, {
    headers: { "user-agent": USER_AGENT, accept: "text/html" },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) return null;
  const html = await response.text();
  const og = extractOgImage(html);
  return isUsableImage(og) ? og : null;
}

export async function backfillMissingImages(limit = 5000): Promise<{ updated: number; skipped: number }> {
  const { data: pending, error } = await supabase
    .from("listings")
    .select("id, listing_url, source")
    .is("deleted_at", null)
    .is("image_url", null)
    .not("listing_url", "is", null)
    .limit(limit);
  if (error) throw error;

  const rows = pending ?? [];
  console.log(`[Images] ${rows.length} anunțuri fără poză de procesat.`);

  let updated = 0;
  let skipped = 0;
  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    try {
      const og = await fetchOgImage(row.listing_url);
      if (!og) {
        skipped++;
      } else {
        const { error: updateError } = await supabase
          .from("listings")
          .update({ image_url: og })
          .is("deleted_at", null)
          .eq("id", row.id);
        if (updateError) throw updateError;
        updated++;
      }
    } catch (err) {
      skipped++;
      const detail = err instanceof Error ? err.message : String(err);
      console.warn(`[Images] ${row.listing_url}: ${detail}`);
    }
    if ((index + 1) % 50 === 0) {
      console.log(`[Images] ${index + 1}/${rows.length} — ${updated} completate, ${skipped} sărite.`);
    }
  }

  console.log(`[Images] Gata: ${updated} poze completate, ${skipped} fără poză utilizabilă.`);
  return { updated, skipped };
}

import { supabase } from "./db";

interface DbListing {
  id: string;
  title: string;
  price: number | null;
  currency: string | null;
  location: string | null;
  surface_sqm: number | null;
  transaction_type: "sale" | "rent";
  date_scraped: string;
  duplicate_of_id: string | null;
}

/**
 * Normalizes location string for proximity comparison (lowercase, removes diacritics and extra punctuation).
 */
function normalizeLocation(loc: string | null): string {
  if (!loc) return "";
  return loc
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^\w\s]/gi, " ")
    .trim();
}

/**
 * Checks if two location strings share a common neighborhood keyword or substring.
 */
function areLocationsSimilar(locA: string | null, locB: string | null): boolean {
  if (!locA || !locB) return true; // If one has no location, allow price/surface matching
  const normA = normalizeLocation(locA);
  const normB = normalizeLocation(locB);

  if (normA.includes(normB) || normB.includes(normA)) return true;

  const wordsA = normA.split(/\s+/).filter((w) => w.length > 3);
  const wordsB = normB.split(/\s+/).filter((w) => w.length > 3);

  for (const word of wordsA) {
    if (wordsB.includes(word)) return true;
  }
  return false;
}

/**
 * Scans active listings in Supabase and links identical property ads posted on different portals.
 */
export async function detectAndLinkDuplicates(): Promise<number> {
  const { data: listings, error } = await supabase
    .from("listings")
    .select("id, title, price, currency, location, surface_sqm, transaction_type, date_scraped, duplicate_of_id")
    .order("date_scraped", { ascending: true });

  if (error) {
    console.warn("Eroare la citirea anunțurilor pentru deduplicare:", error);
    return 0;
  }

  if (!listings || listings.length < 2) return 0;

  const items = listings as DbListing[];
  const updatesToApply = new Map<string, string>(); // listing_id -> primary_listing_id

  for (let i = 0; i < items.length; i++) {
    const primary = items[i];
    // Skip if already marked as a duplicate of another listing
    if (primary.duplicate_of_id) continue;

    for (let j = i + 1; j < items.length; j++) {
      const candidate = items[j];
      if (candidate.duplicate_of_id || updatesToApply.has(candidate.id)) continue;

      // 1. Must match transaction type (sale vs. rent)
      if (primary.transaction_type !== candidate.transaction_type) continue;

      // 2. Must have matching surface sqm (within 1.5 m² tolerance)
      if (
        primary.surface_sqm !== null &&
        candidate.surface_sqm !== null &&
        Math.abs(primary.surface_sqm - candidate.surface_sqm) > 1.5
      ) {
        continue;
      }

      // 3. Must have matching price (within 4% tolerance)
      if (primary.price !== null && candidate.price !== null) {
        const maxPrice = Math.max(primary.price, candidate.price);
        if (maxPrice > 0) {
          const diffPct = Math.abs(primary.price - candidate.price) / maxPrice;
          if (diffPct > 0.04) continue;
        }
      }

      // 4. Must match location proximity
      if (!areLocationsSimilar(primary.location, candidate.location)) continue;

      // Match confirmed! Mark candidate as a duplicate of primary
      updatesToApply.set(candidate.id, primary.id);
    }
  }

  if (updatesToApply.size === 0) {
    console.log("Deduplicare completă: Nu s-au găsit duplicate noi.");
    return 0;
  }

  // Execute updates in batches
  const updateEntries = Array.from(updatesToApply.entries());
  for (const [dupId, masterId] of updateEntries) {
    await supabase
      .from("listings")
      .update({ duplicate_of_id: masterId })
      .eq("id", dupId);
  }

  console.log(`Deduplicare completă: Au fost identificate și legate ${updatesToApply.size} anunțuri duplicate.`);
  return updatesToApply.size;
}

import { supabase } from "./db";

export interface DbListing {
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

interface PreparedListing {
  item: DbListing;
  titleNormalized: string;
  titleGrams: Set<string>;
  locationNormalized: string;
  locationGrams: Set<string>;
}

function prepareListing(item: DbListing): PreparedListing {
  return {
    item,
    titleNormalized: normalizeText(item.title),
    titleGrams: trigrams(item.title),
    locationNormalized: item.location ? normalizeText(item.location) : "",
    locationGrams: item.location ? trigrams(item.location) : new Set<string>(),
  };
}

export function findDuplicateLinks(items: DbListing[]): Map<string, string> {
  // Normalize each title/location and build its trigram set once, instead of
  // recomputing them inside every pairwise comparison.
  const prepared = items.map(prepareListing);
  const updatesToApply = new Map<string, string>();
  for (let i = 0; i < prepared.length; i++) {
    const primary = prepared[i];
    if (primary.item.duplicate_of_id) continue;
    for (let j = i + 1; j < prepared.length; j++) {
      const candidate = prepared[j];
      if (candidate.item.duplicate_of_id || updatesToApply.has(candidate.item.id)) continue;
      if (primary.item.transaction_type !== candidate.item.transaction_type) continue;
      if (primary.item.currency && candidate.item.currency && primary.item.currency !== candidate.item.currency) continue;
      if (
        primary.item.surface_sqm !== null && candidate.item.surface_sqm !== null &&
        Math.abs(primary.item.surface_sqm - candidate.item.surface_sqm) > 1.5
      ) continue;
      if (primary.item.price !== null && candidate.item.price !== null) {
        const maxPrice = Math.max(primary.item.price, candidate.item.price);
        if (maxPrice > 0 && Math.abs(primary.item.price - candidate.item.price) / maxPrice > 0.04) continue;
      }
      if (!preparedTextsSimilar(primary.titleNormalized, primary.titleGrams, candidate.titleNormalized, candidate.titleGrams, 0.42)) continue;
      if (!preparedTextsSimilar(primary.locationNormalized, primary.locationGrams, candidate.locationNormalized, candidate.locationGrams, 0.38)) continue;
      updatesToApply.set(candidate.item.id, primary.item.id);
    }
  }
  return updatesToApply;
}

/**
 * Normalizes location string for proximity comparison (lowercase, removes diacritics and extra punctuation).
 */
function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function trigrams(value: string): Set<string> {
  const padded = `  ${normalizeText(value)}  `;
  const result = new Set<string>();
  for (let index = 0; index <= padded.length - 3; index += 1) {
    result.add(padded.slice(index, index + 3));
  }
  return result;
}

function similarityFromGrams(leftGrams: Set<string>, rightGrams: Set<string>): number {
  if (leftGrams.size === 0 || rightGrams.size === 0) return 0;
  let intersection = 0;
  for (const gram of leftGrams) {
    if (rightGrams.has(gram)) intersection += 1;
  }
  return (2 * intersection) / (leftGrams.size + rightGrams.size);
}

export function fuzzyTextSimilarity(left: string, right: string): number {
  return similarityFromGrams(trigrams(left), trigrams(right));
}

/**
 * Compares two already-normalized strings with their precomputed trigram sets,
 * treating substring containment as an automatic match.
 */
function preparedTextsSimilar(
  normalizedLeft: string,
  leftGrams: Set<string>,
  normalizedRight: string,
  rightGrams: Set<string>,
  threshold: number
): boolean {
  if (!normalizedLeft || !normalizedRight) return false;
  if (normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft)) return true;
  return similarityFromGrams(leftGrams, rightGrams) >= threshold;
}

/**
 * Scans active listings in Supabase and links identical property ads posted on different portals.
 */
export async function detectAndLinkDuplicates(): Promise<number> {
  const { data: listings, error } = await supabase
    .from("listings")
    .select("id, title, price, currency, location, surface_sqm, transaction_type, date_scraped, duplicate_of_id")
    .is("deleted_at", null)
    .order("date_scraped", { ascending: true });

  if (error) {
    console.warn("Eroare la citirea anunțurilor pentru deduplicare:", error);
    return 0;
  }

  if (!listings || listings.length < 2) return 0;

  const items = listings as DbListing[];
  const updatesToApply = findDuplicateLinks(items);

  if (updatesToApply.size === 0) {
    console.log("Deduplicare completă: Nu s-au găsit duplicate noi.");
    return 0;
  }

  // Execute updates in parallel batches instead of one round-trip at a time.
  const updateEntries = Array.from(updatesToApply.entries());
  let linked = 0;
  for (let index = 0; index < updateEntries.length; index += 20) {
    const batch = updateEntries.slice(index, index + 20);
    const results = await Promise.all(
      batch.map(([dupId, masterId]) =>
        supabase.from("listings").update({ duplicate_of_id: masterId }).eq("id", dupId)
      )
    );
    results.forEach((result, offset) => {
      if (result.error) {
        console.warn(`Nu s-a putut lega anunțul duplicat ${batch[offset][0]}:`, result.error.message);
      } else {
        linked += 1;
      }
    });
  }

  console.log(`Deduplicare completă: Au fost identificate și legate ${linked} anunțuri duplicate.`);
  return linked;
}

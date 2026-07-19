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

export function findDuplicateLinks(items: DbListing[]): Map<string, string> {
  const updatesToApply = new Map<string, string>();
  for (let i = 0; i < items.length; i++) {
    const primary = items[i];
    if (primary.duplicate_of_id) continue;
    for (let j = i + 1; j < items.length; j++) {
      const candidate = items[j];
      if (candidate.duplicate_of_id || updatesToApply.has(candidate.id)) continue;
      if (primary.transaction_type !== candidate.transaction_type) continue;
      if (primary.currency && candidate.currency && primary.currency !== candidate.currency) continue;
      if (
        primary.surface_sqm !== null && candidate.surface_sqm !== null &&
        Math.abs(primary.surface_sqm - candidate.surface_sqm) > 1.5
      ) continue;
      if (primary.price !== null && candidate.price !== null) {
        const maxPrice = Math.max(primary.price, candidate.price);
        if (maxPrice > 0 && Math.abs(primary.price - candidate.price) / maxPrice > 0.04) continue;
      }
      if (!areTextsSimilar(primary.title, candidate.title, 0.42)) continue;
      if (!areLocationsSimilar(primary.location, candidate.location)) continue;
      updatesToApply.set(candidate.id, primary.id);
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

export function fuzzyTextSimilarity(left: string, right: string): number {
  const leftGrams = trigrams(left);
  const rightGrams = trigrams(right);
  if (leftGrams.size === 0 || rightGrams.size === 0) return 0;
  let intersection = 0;
  for (const gram of leftGrams) {
    if (rightGrams.has(gram)) intersection += 1;
  }
  return (2 * intersection) / (leftGrams.size + rightGrams.size);
}

function areTextsSimilar(left: string, right: string, threshold: number): boolean {
  const normalizedLeft = normalizeText(left);
  const normalizedRight = normalizeText(right);
  if (!normalizedLeft || !normalizedRight) return false;
  if (normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft)) return true;
  return fuzzyTextSimilarity(normalizedLeft, normalizedRight) >= threshold;
}

function areLocationsSimilar(locA: string | null, locB: string | null): boolean {
  if (!locA || !locB) return false;
  return areTextsSimilar(locA, locB, 0.38);
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

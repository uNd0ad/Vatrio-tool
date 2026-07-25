import { chunkByEncodedLength } from "./batching";
import { supabase } from "./db";

// Generice pe orice anunț cu URL: filtrul rulează după etapa de parsare, deci
// primește `ParsedListing`, și trebuie să întoarcă exact același tip.
export function excludeKnownListings<T extends { listing_url: string }>(
  listings: T[],
  knownUrls: ReadonlySet<string>
): T[] {
  return listings.filter((listing) => !knownUrls.has(listing.listing_url));
}

export async function filterNewListings<T extends { listing_url: string }>(listings: T[]): Promise<T[]> {
  if (listings.length === 0) return [];
  const knownUrls = new Set<string>();
  const urls = [...new Set(listings.map((listing) => listing.listing_url))];

  // Loturile se taie după lungimea codificată, nu după un număr fix: 200 de
  // URL-uri de anunț depășeau limita de antete a serverului (~16KB).
  for (const batchUrls of chunkByEncodedLength(urls)) {
    const { data, error } = await supabase
      .from("listings")
      .select("listing_url")
      .in("listing_url", batchUrls);
    if (error) throw error;
    const knownBatch = (data ?? []).map((row) => row.listing_url);
    for (const url of knownBatch) knownUrls.add(url);
    if (knownBatch.length > 0) {
      const { error: touchError } = await supabase
        .from("listings")
        .update({ last_seen_at: new Date().toISOString(), is_stale: false })
        .in("listing_url", knownBatch);
      if (touchError) throw touchError;
    }
  }
  return excludeKnownListings(listings, knownUrls);
}

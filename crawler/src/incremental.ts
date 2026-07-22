import { chunkByEncodedLength } from "./batching";
import { supabase, type RawListing } from "./db";

export function excludeKnownListings(listings: RawListing[], knownUrls: ReadonlySet<string>): RawListing[] {
  return listings.filter((listing) => !knownUrls.has(listing.listing_url));
}

export async function filterNewListings(listings: RawListing[]): Promise<RawListing[]> {
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

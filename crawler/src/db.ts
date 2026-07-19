import { createClient } from "@supabase/supabase-js";
import "dotenv/config";
import { versionScrapedData } from "./schema";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // service role, NOT anon key — crawler writes server-side only

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Lipsesc SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY din .env");
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface RawListing {
  title: string;
  price: number | null;
  currency: string | null;
  location: string | null;
  property_type: string | null;
  surface_sqm: number | null;
  image_url: string | null;
  listing_url: string;
  source: "olx" | "storia" | "imobiliare" | "homezz" | "publi24";
  seller_type: "owner" | "agency" | "developer" | "unknown";
  transaction_type: "sale" | "rent";
}

// Insert only unseen URLs. The database conflict handling makes this safe even
// when the same URL appears twice in one crawl or two crawlers run concurrently.
// Existing rows are ignored so manually edited status/notes are preserved.
export async function upsertListings(listings: RawListing[]) {
  if (listings.length === 0) return;

  const uniqueByUrl = new Map<string, RawListing>();
  for (const listing of listings) {
    const previous = uniqueByUrl.get(listing.listing_url);
    // Dacă OLX repetă un card, păstrăm varianta care are fotografie reală.
    if (!previous || (!previous.image_url && listing.image_url)) {
      uniqueByUrl.set(listing.listing_url, listing);
    }
  }
  const uniqueListings = Array.from(uniqueByUrl.values());
  const rows = uniqueListings
    .map((l) => versionScrapedData({
      ...l,
      status: "new" as const,
      date_scraped: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
      is_stale: false,
    }));

  const { data, error } = await supabase
    .from("listings")
    .upsert(rows, { onConflict: "listing_url", ignoreDuplicates: true })
    .select("listing_url");
  if (error) throw error;

  const insertedCount = data?.length ?? 0;
  console.log(
    insertedCount === 0
      ? "Niciun anunț nou."
      : `Adăugate ${insertedCount} anunțuri noi.`
  );

  await backfillMissingImages(uniqueListings);
  await syncSellerTypes(uniqueListings);
}

export async function recordSuccessfulCrawl(listingCount: number): Promise<void> {
  const { error } = await supabase.from("crawler_runs").insert({ listing_count: listingCount });
  if (error) throw error;
}

async function backfillMissingImages(listings: RawListing[]) {
  const withImages = listings.filter((listing) => listing.image_url);
  if (withImages.length === 0) return;

  const urls = withImages.map((listing) => listing.listing_url);
  const { data: stored, error } = await supabase
    .from("listings")
    .select("listing_url, image_url")
    .in("listing_url", urls);
  if (error) throw error;

  const missingUrls = new Set(
    (stored ?? [])
      .filter((listing) =>
        !listing.image_url || listing.image_url.includes("no_thumbnail")
      )
      .map((listing) => listing.listing_url)
  );
  const toBackfill = withImages.filter((listing) => missingUrls.has(listing.listing_url));

  // Loturi mici rulează în paralel pentru a evita blocarea secvențială.
  const batchPromises = [];
  for (let index = 0; index < toBackfill.length; index += 10) {
    const batch = toBackfill.slice(index, index + 10);
    batchPromises.push(
      Promise.all(batch.map((listing) =>
        supabase
          .from("listings")
          .update({ image_url: listing.image_url })
          .eq("listing_url", listing.listing_url)
      ))
    );
  }
  const results = await Promise.all(batchPromises);
  for (const batchResult of results) {
    const failed = batchResult.find((result) => result.error)?.error;
    if (failed) throw failed;
  }

  if (toBackfill.length > 0) {
    console.log(`Completate ${toBackfill.length} imagini lipsă.`);
  }
}

async function syncSellerTypes(listings: RawListing[]) {
  const urls = listings.map((listing) => listing.listing_url);
  const { data: stored, error } = await supabase
    .from("listings")
    .select("listing_url, seller_type")
    .in("listing_url", urls);
  if (error) throw error;

  const needsType = new Set(
    (stored ?? [])
      .filter((listing) => !listing.seller_type || listing.seller_type === "unknown")
      .map((listing) => listing.listing_url)
  );
  const toUpdate = listings.filter((listing) =>
    listing.seller_type !== "unknown" && needsType.has(listing.listing_url)
  );

  const batchPromises = [];
  for (let index = 0; index < toUpdate.length; index += 10) {
    const batch = toUpdate.slice(index, index + 10);
    batchPromises.push(
      Promise.all(batch.map((listing) =>
        supabase
          .from("listings")
          .update({ seller_type: listing.seller_type })
          .eq("listing_url", listing.listing_url)
      ))
    );
  }
  const results = await Promise.all(batchPromises);
  for (const batchResult of results) {
    const failed = batchResult.find((result) => result.error)?.error;
    if (failed) throw failed;
  }

  if (toUpdate.length > 0) {
    console.log(`Clasificate ${toUpdate.length} anunțuri după tipul vânzătorului.`);
  }
}

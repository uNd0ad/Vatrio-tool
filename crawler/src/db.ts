import { createClient } from "@supabase/supabase-js";
import "dotenv/config";
import { versionScrapedData } from "./schema";
import { hasPriceChanged } from "./priceHistory";
import { isValidListingImage, listingImageObjectPath, MAX_LISTING_IMAGE_BYTES } from "./imageStorage";

import { geocodeListing, withGeocodedCoordinates } from "./geocoding";
import { normalizeLocation } from "./location";
import { inferPropertyType } from "./propertyType";
import { inferTransactionType } from "./transactionType";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // service role, NOT anon key — crawler writes server-side only

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Lipsesc SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. " +
    "Local: completează-le în crawler/.env. " +
    "În GitHub Actions: Settings → Secrets and variables → Actions."
  );
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
  latitude?: number | null;
  longitude?: number | null;
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
  const uniqueListings = await mirrorListingImages(Array.from(uniqueByUrl.values()));
  const rows = uniqueListings
    .map((l) => ({
      ...l,
      // Portalurile lipesc prospețimea de locație ("Timisoara - Reactualizat la
      // 16 iulie 2026"); nenormalizată ajunge zonă distinctă pe hartă și în
      // raportul de zone.
      location: l.location === null ? null : normalizeLocation(l.location, l.location),
      property_type: inferPropertyType(l.listing_url || l.title, l.property_type),
      transaction_type: inferTransactionType(l.listing_url || l.title, l.transaction_type || "sale"),
    }))
    .map((l) => withGeocodedCoordinates(l))
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
  await syncPrices(uniqueListings);
}

async function mirrorListingImages(listings: RawListing[]): Promise<RawListing[]> {
  if (process.env.CRAWLER_MIRROR_IMAGES === "false") return listings;
  const mirrored = [...listings];
  for (let index = 0; index < listings.length; index += 5) {
    const batch = listings.slice(index, index + 5);
    const results = await Promise.all(batch.map(mirrorListingImage));
    results.forEach((listing, offset) => { mirrored[index + offset] = listing; });
  }
  return mirrored;
}

async function mirrorListingImage(listing: RawListing): Promise<RawListing> {
  if (!listing.image_url?.startsWith("http")) return listing;
  try {
    const response = await fetch(listing.image_url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) return listing;
    const contentType = response.headers.get("content-type")?.split(";")[0].trim().toLowerCase() ?? "";
    const declaredSize = Number(response.headers.get("content-length") ?? 0);
    if (declaredSize > MAX_LISTING_IMAGE_BYTES) return listing;
    const bytes = await readImageBytes(response);
    if (!bytes) return listing;
    if (!isValidListingImage(contentType, bytes.byteLength)) return listing;
    const objectPath = listingImageObjectPath(listing.listing_url, contentType);
    if (!objectPath) return listing;
    const bucket = process.env.CRAWLER_IMAGE_BUCKET ?? "listing-images";
    const { error } = await supabase.storage.from(bucket).upload(objectPath, bytes, {
      contentType,
      cacheControl: "31536000",
      upsert: true,
    });
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
    return { ...listing, image_url: data.publicUrl };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.warn(`[Storage] Nu s-a putut salva imaginea pentru ${listing.listing_url}: ${detail}`);
    return listing;
  }
}

async function readImageBytes(response: Response): Promise<Uint8Array | null> {
  if (!response.body) return null;
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_LISTING_IMAGE_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
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
    .is("deleted_at", null)
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
          .is("deleted_at", null)
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
    .is("deleted_at", null)
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
          .is("deleted_at", null)
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

async function syncPrices(listings: RawListing[]) {
  const urls = listings.map((listing) => listing.listing_url);
  const { data: stored, error } = await supabase
    .from("listings")
    .select("listing_url, price, currency")
    .is("deleted_at", null)
    .in("listing_url", urls);
  if (error) throw error;

  const storedByUrl = new Map(
    (stored ?? []).map((listing) => [listing.listing_url, listing])
  );
  const changed = listings.filter((listing) => {
    const existing = storedByUrl.get(listing.listing_url);
    return existing && hasPriceChanged(existing, listing);
  });

  const batchPromises = [];
  for (let index = 0; index < changed.length; index += 10) {
    const batch = changed.slice(index, index + 10);
    batchPromises.push(Promise.all(batch.map((listing) =>
      supabase
        .from("listings")
        .update({ price: listing.price, currency: listing.currency })
        .is("deleted_at", null)
        .eq("listing_url", listing.listing_url)
    )));
  }
  const results = await Promise.all(batchPromises);
  for (const batchResult of results) {
    const failed = batchResult.find((result) => result.error)?.error;
    if (failed) throw failed;
  }

  if (changed.length > 0) {
    console.log(`Actualizate ${changed.length} prețuri; istoricul a fost păstrat.`);
  }
}

/**
 * Completează coordonatele anunțurilor deja existente în bază. `upsertListings`
 * folosește `ignoreDuplicates`, deci rândurile scrise înainte ca geocodarea să
 * existe nu le-ar primi niciodată — ele sunt invizibile pe hartă. Rulează o
 * dată per crawl, independent de anunțurile găsite în rularea curentă.
 */
export async function backfillMissingCoordinates(batchSize = 500): Promise<number> {
  const { data: pending, error } = await supabase
    .from("listings")
    .select("listing_url, location, title")
    .is("deleted_at", null)
    .is("latitude", null)
    .not("location", "is", null)
    .limit(batchSize);
  if (error) throw error;

  const updates = (pending ?? [])
    .map((listing) => {
      const location = normalizeLocation(listing.location, listing.location ?? "");
      return {
        listing_url: listing.listing_url,
        // Locația veche păstrează sufixul de prospețime; o curățăm odată cu
        // geocodarea, altfel harta și raportul de zone o tratează ca zonă.
        location: location !== listing.location ? location : null,
        ...geocodeListing(location, listing.title),
      };
    })
    .filter((listing) => listing.latitude !== null && listing.longitude !== null);

  const batchPromises = [];
  for (let index = 0; index < updates.length; index += 10) {
    const batch = updates.slice(index, index + 10);
    batchPromises.push(Promise.all(batch.map((listing) =>
      supabase
        .from("listings")
        .update({
          latitude: listing.latitude,
          longitude: listing.longitude,
          ...(listing.location === null ? {} : { location: listing.location }),
        })
        .is("deleted_at", null)
        .eq("listing_url", listing.listing_url)
    )));
  }
  const results = await Promise.all(batchPromises);
  for (const batchResult of results) {
    const failed = batchResult.find((result) => result.error)?.error;
    if (failed) throw failed;
  }

  if (updates.length > 0) {
    console.log(`[Geocoding] Coordonate completate pentru ${updates.length} anunțuri existente.`);
  }
  return updates.length;
}

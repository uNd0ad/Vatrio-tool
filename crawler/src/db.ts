import { createClient } from "@supabase/supabase-js";
import "dotenv/config";
import { versionScrapedData } from "./schema";
import { hasPriceChanged } from "./priceHistory";
import { isValidListingImage, listingImageObjectPath, MAX_LISTING_IMAGE_BYTES } from "./imageStorage";

import { collectInBatches } from "./batching";
import { geocodeListing, withGeocodedCoordinates } from "./geocoding";
import { normalizeLocation } from "./location";
import { parseListings, resolveNeighborhood, type ParsedListing } from "./parser";
import { parseRooms } from "./parser/attributes";
import { isMissingColumnError } from "./missingColumn";

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
  /**
   * Semnale brute pentru parser, nu coloane din bază: textul integral al
   * cardului și textul prețului așa cum l-a scris portalul. `toListingRow` le
   * lasă afară la scriere.
   */
  raw_text?: string | null;
  raw_price_text?: string | null;
}

// Coloanele adăugate de parser. Sunt separate ca să putem scrie și în baze pe
// care migrația `20260725000100_listing_parser_fields` nu a ajuns încă.
const PARSER_COLUMNS = ["neighborhood", "rooms", "parse_warnings"] as const;

let warnedAboutParserColumns = false;

/**
 * Rândul exact care ajunge în `public.listings`. Proiecția e explicită pentru că
 * anunțul parsat cară și semnale de lucru (textul cardului, sursa cartierului),
 * iar un câmp în plus într-un insert PostgREST înseamnă eroare pe tot lotul.
 */
function toListingRow(listing: ParsedListing & { latitude?: number | null; longitude?: number | null }) {
  const now = new Date().toISOString();
  return versionScrapedData({
    title: listing.title,
    price: listing.price,
    currency: listing.currency,
    location: listing.location,
    property_type: listing.property_type,
    surface_sqm: listing.surface_sqm,
    image_url: listing.image_url,
    listing_url: listing.listing_url,
    source: listing.source,
    seller_type: listing.seller_type,
    transaction_type: listing.transaction_type,
    latitude: listing.latitude ?? null,
    longitude: listing.longitude ?? null,
    neighborhood: listing.neighborhood,
    rooms: listing.rooms,
    parse_warnings: listing.parse_warnings,
    status: "new" as const,
    date_scraped: now,
    last_seen_at: now,
    is_stale: false,
  });
}

type ListingRow = ReturnType<typeof toListingRow>;

function withoutParserColumns(row: ListingRow) {
  const stripped: Record<string, unknown> = { ...row };
  for (const column of PARSER_COLUMNS) delete stripped[column];
  return stripped;
}

// Insert only unseen URLs. The database conflict handling makes this safe even
// when the same URL appears twice in one crawl or two crawlers run concurrently.
// Existing rows are ignored so manually edited status/notes are preserved.
export async function upsertListings(listings: Array<RawListing | ParsedListing>) {
  if (listings.length === 0) return;

  // Ultima poartă înainte de bază: dacă un apelant a sărit etapa de parsare,
  // o facem aici, ca în `listings` să nu intre niciodată date neparsate.
  const parsed = parseListings(listings);

  const uniqueByUrl = new Map<string, ParsedListing>();
  for (const listing of parsed) {
    const previous = uniqueByUrl.get(listing.listing_url);
    // Dacă OLX repetă un card, păstrăm varianta care are fotografie reală.
    if (!previous || (!previous.image_url && listing.image_url)) {
      uniqueByUrl.set(listing.listing_url, listing);
    }
  }
  const uniqueListings = await mirrorListingImages(Array.from(uniqueByUrl.values()));
  const rows = uniqueListings
    .map((l) => withGeocodedCoordinates(l))
    .map((l) => toListingRow(l));

  const { data, error } = await insertListingRows(rows);
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

/**
 * Scrie lotul, iar dacă baza nu are încă coloanele parserului reia inserarea
 * fără ele. Fără această plasă, o migrație neaplicată ar transforma o rulare
 * întreagă de crawler în zero anunțuri salvate.
 */
async function insertListingRows(rows: ListingRow[]) {
  const upsert = (payload: Array<ListingRow | Record<string, unknown>>) =>
    supabase
      .from("listings")
      .upsert(payload, { onConflict: "listing_url", ignoreDuplicates: true })
      .select("listing_url");

  const attempt = await upsert(rows);
  if (!attempt.error || !isMissingColumnError(attempt.error)) return attempt;

  if (!warnedAboutParserColumns) {
    warnedAboutParserColumns = true;
    console.warn(
      `[Parser] Baza nu are coloanele ${PARSER_COLUMNS.join(", ")} (${attempt.error.message}). ` +
      "Se scrie fără ele; aplică migrația 20260725000100_listing_parser_fields cu `supabase db push`."
    );
  }
  return upsert(rows.map(withoutParserColumns));
}

async function mirrorListingImages<T extends RawListing>(listings: T[]): Promise<T[]> {
  if (process.env.CRAWLER_MIRROR_IMAGES === "false") return listings;
  const mirrored = [...listings];
  for (let index = 0; index < listings.length; index += 5) {
    const batch = listings.slice(index, index + 5);
    const results = await Promise.all(batch.map(mirrorListingImage));
    results.forEach((listing, offset) => { mirrored[index + offset] = listing; });
  }
  return mirrored;
}

async function mirrorListingImage<T extends RawListing>(listing: T): Promise<T> {
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
  const stored = await collectInBatches(urls, async (batch) => {
    const { data, error } = await supabase
      .from("listings")
      .select("listing_url, image_url")
      .is("deleted_at", null)
      .in("listing_url", batch);
    if (error) throw error;
    return data ?? [];
  });

  const missingUrls = new Set(
    stored
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
  const stored = await collectInBatches(urls, async (batch) => {
    const { data, error } = await supabase
      .from("listings")
      .select("listing_url, seller_type")
      .is("deleted_at", null)
      .in("listing_url", batch);
    if (error) throw error;
    return data ?? [];
  });

  const needsType = new Set(
    stored
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
  const stored = await collectInBatches(urls, async (batch) => {
    const { data, error } = await supabase
      .from("listings")
      .select("listing_url, price, currency")
      .is("deleted_at", null)
      .in("listing_url", batch);
    if (error) throw error;
    return data ?? [];
  });

  const storedByUrl = new Map(
    stored.map((listing) => [listing.listing_url, listing])
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
      // Cartierul dedus de parser e cel mai bun indiciu de coordonate: locația
      // portalului e adesea doar "Timișoara", ceea ce ar aduna toate anunțurile
      // în centrul orașului.
      const { neighborhood } = resolveNeighborhood({ location, title: listing.title });
      return {
        listing_url: listing.listing_url,
        // Locația veche păstrează sufixul de prospețime; o curățăm odată cu
        // geocodarea, altfel harta și raportul de zone o tratează ca zonă.
        location: location !== listing.location ? location : null,
        ...geocodeListing(location, listing.title, neighborhood),
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

/**
 * Completează cartierul (și numărul de camere) pentru anunțurile intrate în bază
 * înainte de parser. La fel ca la coordonate, `upsertListings` ignoră rândurile
 * existente, deci fără acest pas anunțurile vechi ar rămâne pentru totdeauna
 * fără cartier, iar filtrul din UI ar arăta o piață pe jumătate.
 *
 * Atinge doar câmpurile lipsă — titlurile, prețurile și statusurile rândurilor
 * existente rămân neschimbate.
 */
export async function backfillParserFields(
  batchSize = 500,
  /**
   * Poziția de start în lista de anunțuri fără cartier. Rândurile pe care
   * parserul nu le poate încadra rămân `null` pentru totdeauna, deci un filtru
   * simplu s-ar bloca la nesfârșit pe primele: rularea punctuală
   * (`backfillNeighborhoodsCli`) avansează prin ele cu acest offset.
   */
  offset = 0
): Promise<{ examined: number; updated: number }> {
  const { data: pending, error } = await supabase
    .from("listings")
    .select("listing_url, title, location, rooms")
    .is("deleted_at", null)
    .is("neighborhood", null)
    .order("date_scraped", { ascending: false })
    .range(offset, offset + batchSize - 1);
  if (error) {
    if (isMissingColumnError(error)) {
      console.warn(
        "[Parser] Coloanele parserului lipsesc din bază; sar peste completarea cartierelor. " +
        "Aplică migrația 20260725000100_listing_parser_fields cu `supabase db push`."
      );
      return { examined: 0, updated: 0 };
    }
    throw error;
  }

  const updates = (pending ?? [])
    .map((listing) => {
      const location = listing.location === null ? null : normalizeLocation(listing.location, listing.location);
      const { neighborhood } = resolveNeighborhood({ location, title: listing.title });
      const rooms = listing.rooms ?? parseRooms(listing.title);
      return { listing_url: listing.listing_url, neighborhood, rooms };
    })
    .filter((listing) => listing.neighborhood !== null || listing.rooms !== null);

  const batchPromises = [];
  for (let index = 0; index < updates.length; index += 10) {
    const batch = updates.slice(index, index + 10);
    batchPromises.push(Promise.all(batch.map((listing) =>
      supabase
        .from("listings")
        .update({
          ...(listing.neighborhood === null ? {} : { neighborhood: listing.neighborhood }),
          ...(listing.rooms === null ? {} : { rooms: listing.rooms }),
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

  const withNeighborhood = updates.filter((listing) => listing.neighborhood !== null).length;
  if (updates.length > 0) {
    console.log(`[Parser] Cartier completat pentru ${withNeighborhood} anunțuri existente (din ${pending?.length ?? 0} verificate).`);
  }
  return { examined: pending?.length ?? 0, updated: withNeighborhood };
}

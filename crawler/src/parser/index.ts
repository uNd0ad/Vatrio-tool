import type { RawListing } from "../db";
import { normalizeLocation } from "../location";
import { inferCurrency } from "../price";
import { inferPropertyType } from "../propertyType";
import { classifySellerType } from "../sellerType";
import { parseSurface } from "../surface";
import { inferTransactionType, type TransactionType } from "../transactionType";
import { checkPrice, isPlausibleSurface, parseRooms, type PriceWarning } from "./attributes";
import { resolveNeighborhood, type NeighborhoodSource, type NeighborhoodWarning } from "./neighborhood";
import { cleanTitle } from "./text";

export { NEIGHBORHOOD_NAMES, TIMISOARA_NEIGHBORHOODS } from "./neighborhoods";
export { resolveNeighborhood } from "./neighborhood";

/**
 * Versiunea logicii de parsare. Crește la orice schimbare de comportament, ca
 * `parseListings` să poată recunoaște ce e deja parsat și să nu parseze de două
 * ori aceleași anunțuri.
 */
export const PARSER_VERSION = 1 as const;

export type ParseWarning =
  | NeighborhoodWarning
  | PriceWarning
  | "surface_implausible"
  | "surface_missing"
  | "rooms_unresolved";

/**
 * Anunțul așa cum îl vede tool-ul: câmpurile brute ale crawlerului, normalizate,
 * plus ce a dedus parserul. Etapa dintre crawler și bază — `crawler → parser →
 * db → ui`.
 */
export interface ParsedListing extends RawListing {
  /** Cartierul canonic din `ListaCartiereTM.txt`, sau null dacă nu e sigur. */
  neighborhood: string | null;
  /** Câmpul din care a rezultat cartierul; util în jurnal, nu se scrie în DB. */
  neighborhood_source: NeighborhoodSource | null;
  rooms: number | null;
  /** Ce nu s-a putut deduce sau arată greșit, ca etichete stabile. */
  parse_warnings: ParseWarning[];
  parser_version: typeof PARSER_VERSION;
}

export function isParsedListing(listing: RawListing | ParsedListing): listing is ParsedListing {
  return (listing as ParsedListing).parser_version === PARSER_VERSION;
}

/**
 * Tipul tranzacției afirmat de un text, sau null când textul nu spune nimic.
 *
 * `inferTransactionType` întoarce valoarea de rezervă când nu găsește niciun
 * indiciu, deci nu se poate distinge „am găsit vânzare" de „n-am găsit nimic".
 * Îl întrebăm cu ambele rezerve: dacă răspunde la fel, textul chiar conține un
 * semnal.
 */
function explicitTransactionType(value: string | null | undefined): TransactionType | null {
  if (!value) return null;
  const asSale = inferTransactionType(value, "sale");
  const asRent = inferTransactionType(value, "rent");
  return asSale === asRent ? asSale : null;
}

/**
 * Formează un anunț din ce a citit crawlerul.
 *
 * Scraperele întorc text de portal: titluri cu sufixe de prospețime, locații
 * care sunt uneori doar orașul, prețuri care sunt uneori pe metru pătrat. Aici
 * se decide o singură dată forma canonică — cartier, cameră, suprafață, preț,
 * tip de proprietate și de tranzacție — ca baza și UI-ul să vadă aceleași date.
 */
export function parseListing(raw: RawListing): ParsedListing {
  const warnings: ParseWarning[] = [];

  const title = cleanTitle(raw.title) || raw.title;
  const text = raw.raw_text ?? null;
  // Locația trece prin normalizatorul existent (sufixe de portal, diacritice)
  // înainte să încercăm potrivirea pe cartier.
  const location = raw.location === null || raw.location === undefined
    ? null
    : normalizeLocation(raw.location, raw.location);

  const neighborhood = resolveNeighborhood({ location, title, text });
  warnings.push(...neighborhood.warnings);

  // Slugul portalului e cel mai de încredere ("...-de-inchiriat-timisoara-..."),
  // dar când nu spune nimic trebuie citit titlul. Varianta veche
  // (`listing_url || title`) nu ajungea niciodată la titlu pentru URL-urile fără
  // slug descriptiv — anunțurile rămâneau "other", respectiv pe tipul implicit
  // al căutării.
  const transaction_type = explicitTransactionType(raw.listing_url)
    ?? explicitTransactionType(title)
    ?? raw.transaction_type
    ?? "sale";

  let property_type = inferPropertyType(raw.listing_url, raw.property_type);
  if (property_type === "other") property_type = inferPropertyType(title, raw.property_type);
  if (property_type === "other") property_type = inferPropertyType(text, raw.property_type);

  // Suprafața venită de la scraper se validează la fel ca una extrasă din text;
  // dacă e implauzibilă, mai încercăm o dată din textul cardului.
  let surface_sqm: number | null = null;
  if (isPlausibleSurface(raw.surface_sqm)) {
    surface_sqm = raw.surface_sqm ?? null;
  } else {
    if (raw.surface_sqm != null) warnings.push("surface_implausible");
    surface_sqm = parseSurface(text) ?? parseSurface(title);
  }
  if (surface_sqm === null && property_type !== "land") warnings.push("surface_missing");

  const rooms = parseRooms(title, text);
  if (rooms === null && (property_type === "apartment" || property_type === "house")) {
    warnings.push("rooms_unresolved");
  }

  // Moneda declarată de scraper are prioritate; dacă lipsește, o citim din
  // textul brut al prețului ("1.500 €" vs "7.400 lei").
  const currency = raw.currency ?? inferCurrency(raw.raw_price_text ?? "");
  const price = checkPrice({
    price: raw.price,
    currency,
    transactionType: transaction_type,
    priceText: raw.raw_price_text,
  });
  warnings.push(...price.warnings);

  // Tipul vânzătorului rămâne cel al scraperului dacă l-a putut clasifica;
  // altfel mai încercăm pe textul cardului, unde stau "proprietar"/"comision".
  const seller_type = raw.seller_type !== "unknown"
    ? raw.seller_type
    : classifySellerType(`${text ?? ""} ${title}`);

  return {
    ...raw,
    title,
    price: price.price,
    // Fără preț nu inventăm monedă; cu preț, EUR e moneda implicită a bazei.
    currency: price.price === null ? currency : currency ?? "EUR",
    location,
    property_type,
    surface_sqm,
    transaction_type,
    seller_type,
    neighborhood: neighborhood.neighborhood,
    neighborhood_source: neighborhood.source,
    rooms,
    parse_warnings: warnings,
    parser_version: PARSER_VERSION,
  };
}

/** Parsează un lot, sărind peste anunțurile trecute deja prin parser. */
export function parseListings(listings: Array<RawListing | ParsedListing>): ParsedListing[] {
  return listings.map((listing) => (isParsedListing(listing) ? listing : parseListing(listing)));
}

export interface ParseSummary {
  total: number;
  withNeighborhood: number;
  /** Câte anunțuri per cartier, descrescător. */
  byNeighborhood: Array<[string, number]>;
  warningCounts: Array<[ParseWarning, number]>;
  /** Locații pe care parserul nu le-a putut încadra — candidate de alias nou. */
  unresolvedLocations: string[];
}

/** Statistici pentru jurnalul rulării: cât a reușit parserul să încadreze. */
export function summarizeParse(listings: ParsedListing[], unresolvedSamples = 5): ParseSummary {
  const byNeighborhood = new Map<string, number>();
  const warningCounts = new Map<ParseWarning, number>();
  const unresolved = new Set<string>();

  for (const listing of listings) {
    if (listing.neighborhood) {
      byNeighborhood.set(listing.neighborhood, (byNeighborhood.get(listing.neighborhood) ?? 0) + 1);
    } else if (listing.location) {
      unresolved.add(listing.location);
    }
    for (const warning of listing.parse_warnings) {
      warningCounts.set(warning, (warningCounts.get(warning) ?? 0) + 1);
    }
  }

  return {
    total: listings.length,
    withNeighborhood: listings.filter((listing) => listing.neighborhood !== null).length,
    byNeighborhood: [...byNeighborhood.entries()].sort((a, b) => b[1] - a[1]),
    warningCounts: [...warningCounts.entries()].sort((a, b) => b[1] - a[1]),
    unresolvedLocations: [...unresolved].slice(0, unresolvedSamples),
  };
}

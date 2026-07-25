import assert from "node:assert/strict";
import test from "node:test";
import type { RawListing } from "../db";
import { PARSER_VERSION, isParsedListing, parseListing, parseListings, summarizeParse } from "./index";

/** Un anunț așa cum îl întoarce un scraper, cu semnalele brute atașate. */
function rawListing(overrides: Partial<RawListing> = {}): RawListing {
  return {
    title: "Apartament 2 camere de vânzare",
    price: 85000,
    currency: "EUR",
    location: "Timișoara",
    property_type: null,
    surface_sqm: null,
    image_url: null,
    listing_url: "https://www.storia.ro/ro/oferta/apartament-2-camere-ID1001.html",
    source: "storia",
    seller_type: "unknown",
    transaction_type: "sale",
    ...overrides,
  };
}

test("formează anunțul complet din semnalele crawlerului", () => {
  const parsed = parseListing(rawListing({
    title: "Apartament 2 camere Soarelui ‼️ - Reactualizat la 16 iulie 2026",
    location: "Timisoara",
    raw_text: "Apartament 2 camere, 54 m², etaj 2, proprietar, zona Soarelui",
    raw_price_text: "85.000 €",
  }));

  assert.equal(parsed.title, "Apartament 2 camere Soarelui");
  assert.equal(parsed.neighborhood, "Soarelui");
  assert.equal(parsed.neighborhood_source, "title");
  assert.equal(parsed.rooms, 2);
  assert.equal(parsed.surface_sqm, 54);
  assert.equal(parsed.price, 85000);
  assert.equal(parsed.currency, "EUR");
  assert.equal(parsed.property_type, "apartment");
  assert.equal(parsed.transaction_type, "sale");
  assert.equal(parsed.seller_type, "owner");
  assert.deepEqual(parsed.parse_warnings, []);
  assert.equal(parsed.parser_version, PARSER_VERSION);
});

test("normalizează locația înainte de a căuta cartierul", () => {
  const parsed = parseListing(rawListing({
    location: "Timisoara, Iosefin - Reactualizat la 16 iulie 2026",
  }));
  assert.equal(parsed.location, "Timișoara, Iosefin");
  assert.equal(parsed.neighborhood, "Iosefin");
  assert.equal(parsed.neighborhood_source, "location");
});

test("deduce tipul tranzacției din URL, nu doar din configurația căutării", () => {
  const parsed = parseListing(rawListing({
    listing_url: "https://www.imobiliare.ro/oferta/apartament-2-camere-de-inchiriat-timisoara-XABC12345",
    transaction_type: "sale",
    price: 450,
    raw_price_text: "450 €",
  }));
  assert.equal(parsed.transaction_type, "rent");
  // 450 € e o chirie plauzibilă; ar fi fost semnalat ca preț de vânzare absurd.
  assert.deepEqual(parsed.parse_warnings.filter((w) => w.startsWith("price")), []);
});

test("citește tipul din titlu când URL-ul nu are slug descriptiv", () => {
  // OLX și HomeZZ folosesc URL-uri cu ID, nu cu slug: fără citirea titlului,
  // anunțurile ar rămâne "other" și pe tipul implicit al căutării.
  const rent = parseListing(rawListing({
    title: "Închiriez garsonieră Complexul Studențesc",
    listing_url: "https://www.olx.ro/d/oferta/ID9f8a7b.html",
    transaction_type: "sale",
    price: 350,
  }));
  assert.equal(rent.transaction_type, "rent");
  assert.equal(rent.property_type, "apartment");
  assert.equal(rent.rooms, 1);

  const house = parseListing(rawListing({
    title: "Vând casă cu 4 camere în Freidorf",
    listing_url: "https://homezz.ro/anunt/1234567",
    price: 210000,
  }));
  assert.equal(house.property_type, "house");
  assert.equal(house.transaction_type, "sale");
});

test("slugul URL-ului bate titlul la tipul tranzacției", () => {
  const parsed = parseListing(rawListing({
    title: "Apartament 2 camere de vânzare sau de închiriat",
    listing_url: "https://www.imobiliare.ro/oferta/apartament-2-camere-de-inchiriat-XABC12345",
    price: 400,
    transaction_type: "sale",
  }));
  assert.equal(parsed.transaction_type, "rent");
});

test("aruncă prețul pe metru pătrat și marchează anunțul", () => {
  const parsed = parseListing(rawListing({
    price: 1450,
    raw_price_text: "1.450 €/mp",
    raw_text: "Apartament 3 camere, 70 mp, zona Fabric",
  }));
  assert.equal(parsed.price, null);
  assert.ok(parsed.parse_warnings.includes("price_per_sqm"));
  // Restul datelor rămân utilizabile chiar dacă prețul a fost respins.
  assert.equal(parsed.neighborhood, "Fabric");
  assert.equal(parsed.surface_sqm, 70);
});

test("respinge suprafețele implauzibile venite de la scraper și reîncearcă din text", () => {
  const parsed = parseListing(rawListing({
    surface_sqm: 21000,
    raw_text: "Apartament 2 camere, 62 m², Lipovei",
  }));
  assert.equal(parsed.surface_sqm, 62);
  assert.ok(parsed.parse_warnings.includes("surface_implausible"));
});

test("nu cere suprafață pentru terenuri", () => {
  const parsed = parseListing(rawListing({
    title: "Teren intravilan Freidorf",
    listing_url: "https://www.storia.ro/ro/oferta/teren-intravilan-freidorf-ID2002.html",
    raw_text: "Teren intravilan, front 20 m, Freidorf",
  }));
  assert.equal(parsed.property_type, "land");
  assert.equal(parsed.neighborhood, "Freidorf");
  assert.ok(!parsed.parse_warnings.includes("surface_missing"));
  assert.ok(!parsed.parse_warnings.includes("rooms_unresolved"));
});

test("păstrează clasificarea vânzătorului făcută de scraper", () => {
  const parsed = parseListing(rawListing({
    seller_type: "agency",
    raw_text: "Proprietar vinde apartament",
  }));
  assert.equal(parsed.seller_type, "agency");
});

test("semnalează anunțurile din afara Timișoarei fără să le încadreze", () => {
  const parsed = parseListing(rawListing({
    title: "Casă în Dumbrăvița, aproape de Lipovei",
    location: "Dumbrăvița",
  }));
  assert.equal(parsed.neighborhood, null);
  assert.ok(parsed.parse_warnings.includes("outside_timisoara"));
});

test("parsarea e idempotentă: un anunț deja parsat nu e reparsat", () => {
  const once = parseListing(rawListing({ raw_text: "zona Fabric, 2 camere, 54 mp" }));
  const twice = parseListings([once]);
  assert.equal(twice[0], once, "anunțul parsat trebuie păstrat ca atare");
  assert.equal(isParsedListing(once), true);
  assert.equal(isParsedListing(rawListing()), false);
  // Reparsarea explicită nu schimbă rezultatul.
  assert.deepEqual(parseListing(once), { ...once, parse_warnings: once.parse_warnings });
});

test("parseListings parsează loturile mixte", () => {
  const parsed = parseListings([
    rawListing({ location: "Timișoara, Fabric" }),
    parseListing(rawListing({ location: "Timișoara, Mehala" })),
  ]);
  assert.deepEqual(parsed.map((listing) => listing.neighborhood), ["Fabric", "Mehala"]);
  assert.ok(parsed.every(isParsedListing));
});

test("rezumatul arată cât a încadrat parserul și ce a rămas pe dinafară", () => {
  const summary = summarizeParse(parseListings([
    rawListing({ location: "Timișoara, Fabric" }),
    rawListing({ location: "Timișoara, Fabric", listing_url: "https://storia.ro/2" }),
    rawListing({ location: "Timișoara, Mehala", listing_url: "https://storia.ro/3" }),
    rawListing({ location: "Timișoara, Zona necunoscută", listing_url: "https://storia.ro/4" }),
  ]));

  assert.equal(summary.total, 4);
  assert.equal(summary.withNeighborhood, 3);
  assert.deepEqual(summary.byNeighborhood, [["Fabric", 2], ["Mehala", 1]]);
  assert.deepEqual(summary.unresolvedLocations, ["Timișoara, Zona necunoscută"]);
  assert.ok(summary.warningCounts.some(([warning]) => warning === "neighborhood_unresolved"));
});

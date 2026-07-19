import assert from "node:assert/strict";
import test from "node:test";

process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";

const { findDuplicateLinks, fuzzyTextSimilarity } = await import("./dedup");
type DbListing = import("./dedup").DbListing;

function listing(overrides: Partial<DbListing> & Pick<DbListing, "id">): DbListing {
  return {
    title: "Apartament 2 camere",
    price: 100000,
    currency: "EUR",
    location: "Timișoara, Circumvalațiunii",
    surface_sqm: 55,
    transaction_type: "sale",
    date_scraped: "2026-01-01T00:00:00Z",
    duplicate_of_id: null,
    ...overrides,
  };
}

test("links a likely cross-site duplicate to the older primary listing", () => {
  const links = findDuplicateLinks([
    listing({ id: "olx" }),
    listing({ id: "storia", price: 102000, surface_sqm: 55.8 }),
  ]);
  assert.equal(links.get("storia"), "olx");
});

test("does not link listings with different transaction or price", () => {
  const links = findDuplicateLinks([
    listing({ id: "primary" }),
    listing({ id: "rent", transaction_type: "rent" }),
    listing({ id: "expensive", price: 120000 }),
  ]);
  assert.equal(links.size, 0);
});

test("fuzzy matches title and location variants without diacritics", () => {
  const links = findDuplicateLinks([
    listing({ id: "primary", title: "Apartament 2 camere decomandat", location: "Timișoara, Circumvalațiunii" }),
    listing({ id: "variant", title: "Apartament decomandat cu 2 camere", location: "Timisoara - Circumvalatiunii" }),
  ]);
  assert.equal(links.get("variant"), "primary");
  assert.ok(fuzzyTextSimilarity("Circumvalațiunii", "Circumvalatiunii") > 0.9);
});

test("does not merge unrelated titles or listings with missing locations", () => {
  const links = findDuplicateLinks([
    listing({ id: "apartment" }),
    listing({ id: "house", title: "Casă cu grădină", location: "Timișoara, Circumvalațiunii" }),
    listing({ id: "unknown-location", location: null }),
  ]);
  assert.equal(links.size, 0);
});

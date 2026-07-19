import assert from "node:assert/strict";
import test from "node:test";

process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
const { excludeKnownListings } = await import("./incremental");
type RawListing = import("./db").RawListing;

const base: RawListing = {
  title: "Apartament", price: 100000, currency: "EUR", location: "Timișoara",
  property_type: "Apartament", surface_sqm: 50, image_url: null,
  listing_url: "https://example.test/1", source: "olx", seller_type: "owner", transaction_type: "sale",
};

test("incremental filtering keeps only unseen listing URLs", () => {
  const listings = [base, { ...base, listing_url: "https://example.test/2" }];
  assert.deepEqual(excludeKnownListings(listings, new Set([base.listing_url])), [listings[1]]);
});

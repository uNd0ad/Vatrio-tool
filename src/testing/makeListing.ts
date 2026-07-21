import type { Listing } from "../types";

/** Factory de test: un anunț valid cu override-uri punctuale. */
export function makeListing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: "l-1",
    title: "Apartament 2 camere",
    price: 100000,
    currency: "EUR",
    location: "Timișoara, Circumvalațiunii",
    property_type: "apartment",
    surface_sqm: 55,
    image_url: null,
    listing_url: "https://example.com/anunt/1",
    source: "olx",
    seller_type: "owner",
    transaction_type: "sale",
    date_scraped: "2026-07-01T10:00:00.000Z",
    status: "new",
    notes: null,
    ...overrides,
  };
}

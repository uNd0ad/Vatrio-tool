import type { Listing } from "../types";

/**
 * Câmpurile necesare pentru raportul preț/suprafață. `transaction_type` e
 * obligatoriu intenționat: la închiriere raportul ar fi €/m² **pe lună**, altă
 * unitate decât la vânzare. Afișat sau mediat împreună cu prețurile de vânzare
 * devine derutant — o chirie apărea ca „8 EUR/m²" lângă „1.800 EUR/m²" — iar o
 * medie peste ambele tipuri nu înseamnă nimic.
 */
export type PricePerSqmInput = Pick<Listing, "price" | "surface_sqm" | "transaction_type"> & {
  currency?: string | null;
};

/** Raportul preț/m², doar pentru vânzări; null la închirieri. */
export function calculatePricePerSqm(listing: PricePerSqmInput): number | null {
  if (listing.transaction_type !== "sale") return null;
  const { price, surface_sqm: sqm } = listing;
  if (price === null || sqm === null || sqm <= 0 || price <= 0) return null;
  return Math.round(price / sqm);
}

/** Varianta formatată pentru afișare; șir gol când raportul nu se aplică. */
export function formatPricePerSqm(listing: PricePerSqmInput): string {
  const rate = calculatePricePerSqm(listing);
  if (rate === null) return "";
  return `${new Intl.NumberFormat("ro-RO").format(rate)} ${listing.currency ?? "EUR"}/m²`;
}

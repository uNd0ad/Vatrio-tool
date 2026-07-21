import type { Listing } from "../types";

export function formatPrice(listing: Pick<Listing, "price" | "currency">): string {
  if (listing.price === null) return "Preț indisponibil";
  return `${new Intl.NumberFormat("ro-RO").format(listing.price)} ${
    listing.currency ?? "EUR"
  }`;
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function truncateListingTitle(title: string, maxLength = 70): string {
  if (title.length <= maxLength) return title;
  return `${title.slice(0, maxLength - 1).trimEnd()}…`;
}

import type { ListingStatus, SellerType, TransactionType } from "../types";

export type StatusFilter = ListingStatus | "all";

export const STATUS_LABELS: Record<ListingStatus, string> = {
  new: "Nou",
  contacted: "Contactat",
  refused: "Refuzat",
  closed: "Închis",
};

export const STATUS_ICONS: Record<ListingStatus, string> = {
  new: "●",
  contacted: "◐",
  refused: "×",
  closed: "✓",
};

export function sellerTypeLabel(type: SellerType): string {
  switch (type) {
    case "owner":
      return "Proprietar";
    case "agency":
      return "Agenție";
    case "developer":
      return "Dezvoltator";
    default:
      return "Necunoscut";
  }
}

export function transactionTypeLabel(type: TransactionType): string {
  return type === "sale" ? "De vânzare" : "De închiriat";
}

/**
 * Locația afișată: cartierul stabilit de parser, cu locația brută a portalului
 * ca rezervă. Cartierul e forma comparabilă între portaluri — „Fabric" în loc de
 * „Timisoara - Fabric", „Timișoara, zona Fabric" sau „Fabric, Timiș".
 */
export function listingLocationLabel(
  listing: { neighborhood?: string | null; location?: string | null }
): string {
  return listing.neighborhood ?? listing.location ?? "Nespecificată";
}

export type ListingStatus = "new" | "contacted" | "refused" | "closed";

export type ListingSource = "olx" | "storia" | "imobiliare";
export type SellerType = "owner" | "agency" | "developer" | "unknown";
export type TransactionType = "sale" | "rent";

export interface Listing {
  id: string;
  title: string;
  price: number | null;
  currency: string | null;
  location: string | null;
  property_type: string | null;
  surface_sqm: number | null;
  image_url: string | null;
  listing_url: string; // the field you asked for — link back to the source ad
  source: ListingSource;
  seller_type: SellerType;
  transaction_type: TransactionType;
  date_scraped: string; // ISO timestamp
  status: ListingStatus;
  notes: string | null;
}

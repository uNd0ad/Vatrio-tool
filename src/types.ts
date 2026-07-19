export type ListingStatus = "new" | "contacted" | "refused" | "closed";

export type ListingSource = "olx" | "storia" | "imobiliare" | "homezz" | "publi24";
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
  last_seen_at?: string;
  is_stale?: boolean;
  status: ListingStatus;
  notes: string | null;
  duplicate_of_id?: string | null;
}

export interface ActivityLog {
  id: string;
  listing_id: string;
  user_id: string | null;
  user_email: string;
  action: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

import { supabase } from "../lib/supabaseClient";
import type { Listing, ActivityLog } from "../types";

export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
  hasMore: boolean;
}

export async function fetchLastSuccessfulCrawl(): Promise<string | null> {
  const { data, error } = await supabase
    .from("crawler_runs")
    .select("completed_at")
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.completed_at ?? null;
}

export async function fetchListings(): Promise<Listing[]> {
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .order("date_scraped", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((listing) => ({
    ...listing,
    seller_type: listing.seller_type ?? "unknown",
    transaction_type: listing.transaction_type ?? "sale",
  })) as Listing[];
}

export async function fetchListingsPaginated(
  page: number = 1,
  pageSize: number = 25
): Promise<PaginatedResult<Listing>> {
  const from = (page - 1) * pageSize;
  const to = page * pageSize - 1;

  const { data, error, count } = await supabase
    .from("listings")
    .select(
      "id, title, price, currency, location, property_type, surface_sqm, image_url, listing_url, source, seller_type, transaction_type, date_scraped, status, duplicate_of_id",
      { count: "exact" }
    )
    .order("date_scraped", { ascending: false })
    .range(from, to);

  if (error) throw error;


  const formatted = (data ?? []).map((listing) => ({
    ...listing,
    seller_type: listing.seller_type ?? "unknown",
    transaction_type: listing.transaction_type ?? "sale",
  })) as Listing[];

  const totalCount = count ?? formatted.length;
  const hasMore = to + 1 < totalCount;

  return {
    data: formatted,
    totalCount,
    hasMore,
  };
}

export async function fetchListingDetails(id: string): Promise<{ notes: string | null }> {
  const { data, error } = await supabase
    .from("listings")
    .select("notes")
    .eq("id", id)
    .single();

  if (error) {
    console.warn("Eroare la încărcarea detaliilor anunțului:", error);
    return { notes: null };
  }
  return data ?? { notes: null };
}


export async function logActivity(
  listingId: string,
  action: string,
  oldValue: string | null = null,
  newValue: string | null = null
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("listing_activity_logs").insert({
    listing_id: listingId,
    user_id: user.id,
    user_email: user.email || "Utilizator necunoscut",
    action,
    old_value: oldValue,
    new_value: newValue,
  });
}

export async function fetchActivityLogs(listingId: string): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from("listing_activity_logs")
    .select("*")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("Eroare la preluarea jurnalului de activitate:", error);
    return [];
  }
  return (data ?? []) as ActivityLog[];
}

export async function updateListingStatus(
  id: string,
  status: Listing["status"],
  oldStatus?: Listing["status"]
): Promise<void> {
  const { error } = await supabase
    .from("listings")
    .update({ status })
    .eq("id", id);

  if (error) throw error;

  await logActivity(id, "status_change", oldStatus || null, status).catch((err) =>
    console.warn("Nu s-a putut salva jurnalul de activitate:", err)
  );
}

export async function bulkUpdateListingStatus(
  ids: string[],
  status: Listing["status"]
): Promise<void> {
  if (ids.length === 0) return;

  const { error } = await supabase
    .from("listings")
    .update({ status })
    .in("id", ids);

  if (error) throw error;

  Promise.allSettled(
    ids.map((id) =>
      logActivity(id, "status_change", null, status).catch((err) =>
        console.warn("Nu s-a putut salva jurnalul de activitate la bulk update:", err)
      )
    )
  );
}

export async function updateListingNotes(
  id: string,
  notes: string,
  oldNotes?: string | null
): Promise<void> {
  const { error } = await supabase.from("listings").update({ notes }).eq("id", id);
  if (error) throw error;

  await logActivity(id, "notes_update", oldNotes || null, notes).catch((err) =>
    console.warn("Nu s-a putut salva jurnalul de activitate:", err)
  );
}

export function subscribeToListings(
  onInsert: (listing: Listing) => void,
  onUpdate: (listing: Listing) => void
) {
  const channel = supabase
    .channel("realtime-listings-changes")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "listings" },
      (payload) => {
        const raw = payload.new;
        const newListing: Listing = {
          ...raw,
          seller_type: raw.seller_type ?? "unknown",
          transaction_type: raw.transaction_type ?? "sale",
        } as Listing;
        onInsert(newListing);
      }
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "listings" },
      (payload) => {
        const raw = payload.new;
        const updatedListing: Listing = {
          ...raw,
          seller_type: raw.seller_type ?? "unknown",
          transaction_type: raw.transaction_type ?? "sale",
        } as Listing;
        onUpdate(updatedListing);
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

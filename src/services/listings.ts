import { supabase } from "../lib/supabaseClient";
import type { Listing, ActivityLog, ListingTag } from "../types";
import { isActiveListing } from "../utils/activeListing";

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
  let { data, error } = await supabase
    .from("listings")
    .select("*")
    .is("deleted_at", null)
    .order("date_scraped", { ascending: false });

  // Fallback for databases where deleted_at column migration has not been applied yet
  if (error && (error.message?.includes("deleted_at") || error.code === "42703")) {
    const retry = await supabase
      .from("listings")
      .select("*")
      .order("date_scraped", { ascending: false });
    data = retry.data;
    error = retry.error;
  }

  if (error) throw error;
  return (data ?? []).map((listing: Partial<Listing>) => ({
    ...listing,
    seller_type: listing.seller_type ?? "unknown",
    transaction_type: listing.transaction_type ?? "sale",
  })) as Listing[];
}

export async function searchListingsFullText(query: string, limit = 50): Promise<Listing[]> {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return [];
  const { data, error } = await supabase.rpc("search_active_listings", {
    search_query: normalizedQuery,
    result_limit: Math.min(Math.max(Math.trunc(limit), 1), 200),
  });
  if (error) throw error;
  return (data ?? []).map((listing: Partial<Listing>) => ({
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

  const primary = await supabase
    .from("listings")
    .select(
      "id, title, price, currency, location, property_type, surface_sqm, image_url, listing_url, source, seller_type, transaction_type, date_scraped, status, duplicate_of_id, deleted_at",
      { count: "exact" }
    )
    .is("deleted_at", null)
    .order("date_scraped", { ascending: false })
    .range(from, to);

  let data: any[] | null = primary.data;
  let error = primary.error;
  let count = primary.count;

  // Fallback for databases where deleted_at column migration has not been applied yet
  if (error && (error.message?.includes("deleted_at") || error.code === "42703")) {
    const retry = await supabase
      .from("listings")
      .select(
        "id, title, price, currency, location, property_type, surface_sqm, image_url, listing_url, source, seller_type, transaction_type, date_scraped, status, duplicate_of_id",
        { count: "exact" }
      )
      .order("date_scraped", { ascending: false })
      .range(from, to);
    data = retry.data;
    error = retry.error;
    count = retry.count;
  }

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
  let { data, error } = await supabase
    .from("listings")
    .select("notes")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error && (error.message?.includes("deleted_at") || error.code === "42703")) {
    const retry = await supabase
      .from("listings")
      .select("notes")
      .eq("id", id)
      .single();
    data = retry.data;
    error = retry.error;
  }

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
  let { error } = await supabase
    .from("listings")
    .update({ status })
    .eq("id", id)
    .is("deleted_at", null);

  if (error && (error.message?.includes("deleted_at") || error.code === "42703")) {
    const retry = await supabase.from("listings").update({ status }).eq("id", id);
    error = retry.error;
  }

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

  let { error } = await supabase
    .from("listings")
    .update({ status })
    .in("id", ids)
    .is("deleted_at", null);

  if (error && (error.message?.includes("deleted_at") || error.code === "42703")) {
    const retry = await supabase.from("listings").update({ status }).in("id", ids);
    error = retry.error;
  }

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
  let { error } = await supabase.from("listings").update({ notes }).eq("id", id).is("deleted_at", null);

  if (error && (error.message?.includes("deleted_at") || error.code === "42703")) {
    const retry = await supabase.from("listings").update({ notes }).eq("id", id);
    error = retry.error;
  }

  if (error) throw error;

  await logActivity(id, "notes_update", oldNotes || null, notes).catch((err) =>
    console.warn("Nu s-a putut salva jurnalul de activitate:", err)
  );
}

export async function softDeleteListing(id: string): Promise<void> {
  const { error } = await supabase.rpc("soft_delete_listing", { target_id: id });
  if (error) throw error;
  await logActivity(id, "soft_delete").catch((err) =>
    console.warn("Nu s-a putut salva jurnalul de ștergere:", err)
  );
}

export async function restoreListing(id: string): Promise<void> {
  const { error } = await supabase.rpc("restore_listing", { target_id: id });
  if (error) throw error;
  await logActivity(id, "restore").catch((err) =>
    console.warn("Nu s-a putut salva jurnalul de restaurare:", err)
  );
}

export async function fetchListingTags(listingId: string): Promise<ListingTag[]> {
  const { data, error } = await supabase
    .from("listing_tags")
    .select("tags(id, name, color)")
    .eq("listing_id", listingId);
  if (error) throw error;
  return (data ?? []).flatMap((row: { tags: ListingTag | ListingTag[] | null }) =>
    row.tags ? (Array.isArray(row.tags) ? row.tags : [row.tags]) : []
  );
}

export async function createListingTag(name: string, color = "#64748b"): Promise<ListingTag> {
  const trimmedName = name.trim();
  const { data: existing, error: lookupError } = await supabase
    .from("tags")
    .select("id, name, color")
    .eq("normalized_name", trimmedName.toLocaleLowerCase("ro-RO"))
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (existing) return existing as ListingTag;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required");
  const { data, error } = await supabase
    .from("tags")
    .insert({ name: trimmedName, color, created_by: user.id })
    .select("id, name, color")
    .single();
  if (error) throw error;
  return data as ListingTag;
}

export async function addTagToListing(listingId: string, tagId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required");
  const { error } = await supabase
    .from("listing_tags")
    .upsert(
      { listing_id: listingId, tag_id: tagId, added_by: user.id },
      { onConflict: "listing_id,tag_id", ignoreDuplicates: true }
    );
  if (error) throw error;
}

export async function removeTagFromListing(listingId: string, tagId: string): Promise<void> {
  const { error } = await supabase
    .from("listing_tags")
    .delete()
    .eq("listing_id", listingId)
    .eq("tag_id", tagId);
  if (error) throw error;
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
        if (!isActiveListing(raw)) return;
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
        if (!isActiveListing(raw)) return;
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

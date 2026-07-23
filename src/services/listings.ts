import { supabase } from "../lib/supabaseClient";
import type { Listing, ActivityLog, ListingTag, ListingStatus, SellerType } from "../types";
import { isActiveListing } from "../utils/activeListing";

export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
  hasMore: boolean;
}

export interface ListingFilters {
  search?: string;
  status?: ListingStatus | "all";
  sellerType?: SellerType | "all";
  transactionType?: "all" | "sale" | "rent";
  minPrice?: number | null;
  maxPrice?: number | null;
  minSqm?: number | null;
  maxSqm?: number | null;
  dateRange?: "all" | "24h" | "3d" | "7d";
  hideDuplicates?: boolean;
  sortField?: "price" | "date_scraped" | "status" | "title" | "surface_sqm";
  sortOrder?: "asc" | "desc";
}

export interface StatusCounts {
  all: number;
  new: number;
  contacted: number;
  refused: number;
  closed: number;
}

// Kept as plain string literals (not a template/ternary) so the Supabase typed
// client can statically parse the selected columns. The BASE set is the
// missing-column fallback so newer columns (latitude/longitude) can't break the
// retry too.
const PAGINATED_COLUMNS =
  "id, title, price, currency, location, property_type, surface_sqm, image_url, listing_url, source, seller_type, transaction_type, date_scraped, status, notes, duplicate_of_id, latitude, longitude";
const PAGINATED_COLUMNS_BASE =
  "id, title, price, currency, location, property_type, surface_sqm, image_url, listing_url, source, seller_type, transaction_type, date_scraped, status, notes, duplicate_of_id";

const DATE_RANGE_MS: Record<"24h" | "3d" | "7d", number> = {
  "24h": 24 * 60 * 60 * 1000,
  "3d": 3 * 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
};

function isMissingColumnError(error: { message?: string; code?: string } | null): boolean {
  return !!error && (error.message?.includes("deleted_at") === true || error.code === "42703");
}

/**
 * Applies the shared listing filters to a Supabase query builder. Runs entirely
 * server-side so search and range filters cover the whole table, not just the
 * rows already paginated into the client.
 */
// The query is a Supabase filter builder; its generic types are too deep to
// instantiate through a helper, so it is typed as `any` here (this function only
// chains PostgREST filter methods and returns the same builder).
function applyListingFilters(query: any, filters: ListingFilters): any {
  if (filters.status && filters.status !== "all") query = query.eq("status", filters.status);
  if (filters.sellerType && filters.sellerType !== "all") query = query.eq("seller_type", filters.sellerType);
  if (filters.transactionType && filters.transactionType !== "all") {
    query = query.eq("transaction_type", filters.transactionType);
  }
  if (filters.minPrice != null) query = query.gte("price", filters.minPrice);
  if (filters.maxPrice != null) query = query.lte("price", filters.maxPrice);
  if (filters.minSqm != null) query = query.gte("surface_sqm", filters.minSqm);
  if (filters.maxSqm != null) query = query.lte("surface_sqm", filters.maxSqm);
  if (filters.hideDuplicates) query = query.is("duplicate_of_id", null);
  if (filters.dateRange && filters.dateRange !== "all") {
    const cutoff = new Date(Date.now() - DATE_RANGE_MS[filters.dateRange]).toISOString();
    query = query.gte("date_scraped", cutoff);
  }
  const search = filters.search?.trim();
  if (search) {
    // Strip characters that would break the PostgREST or() grammar, then match
    // the term as a case-insensitive substring across the searchable columns.
    const term = search.replace(/[,()%*\\]/g, " ").trim();
    if (term) {
      const like = `%${term}%`;
      query = query.or(
        `title.ilike.${like},location.ilike.${like},source.ilike.${like},property_type.ilike.${like}`
      );
    }
  }
  return query;
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

export async function fetchListingsPaginated(
  page: number = 1,
  pageSize: number = 25,
  filters: ListingFilters = {}
): Promise<PaginatedResult<Listing>> {
  const from = (page - 1) * pageSize;
  const to = page * pageSize - 1;

  const sortField = filters.sortField ?? "date_scraped";
  const ascending = (filters.sortOrder ?? "desc") === "asc";

  // Two explicit branches (rather than a ternary column string) so each
  // .select() receives a statically parseable literal. The fallback also drops
  // latitude/longitude so a DB missing those newer columns can't fail the retry.
  const runQuery = (includeDeletedFilter: boolean) => {
    if (includeDeletedFilter) {
      const query = applyListingFilters(
        supabase.from("listings").select(PAGINATED_COLUMNS, { count: "exact" }).is("deleted_at", null),
        filters
      );
      return query.order(sortField, { ascending, nullsFirst: false }).range(from, to);
    }
    const query = applyListingFilters(
      supabase.from("listings").select(PAGINATED_COLUMNS_BASE, { count: "exact" }),
      filters
    );
    return query.order(sortField, { ascending, nullsFirst: false }).range(from, to);
  };

  const primary = await runQuery(true);
  let data: Record<string, any>[] | null = primary.data as unknown as Record<string, any>[] | null;
  let error = primary.error;
  let count = primary.count;

  // Fallback for databases where deleted_at column migration has not been applied yet
  if (isMissingColumnError(error)) {
    const fallback = await runQuery(false);
    data = fallback.data as unknown as Record<string, any>[] | null;
    error = fallback.error;
    count = fallback.count;
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

/**
 * Counts active listings per status across the whole table (respecting the
 * transaction-type filter), so the sidebar and stat cards reflect the full
 * dataset rather than only the pages currently loaded.
 */
export async function fetchListingCounts(
  transactionType: "all" | "sale" | "rent" = "all"
): Promise<StatusCounts> {
  const statuses: ListingStatus[] = ["new", "contacted", "refused", "closed"];

  const countFor = async (status?: ListingStatus): Promise<number> => {
    const build = (includeDeletedFilter: boolean) => {
      let query = supabase.from("listings").select("id", { count: "exact", head: true });
      if (includeDeletedFilter) query = query.is("deleted_at", null);
      if (transactionType !== "all") query = query.eq("transaction_type", transactionType);
      if (status) query = query.eq("status", status);
      return query;
    };
    let { count, error } = await build(true);
    if (isMissingColumnError(error)) ({ count, error } = await build(false));
    if (error) throw error;
    return count ?? 0;
  };

  const [all, ...perStatus] = await Promise.all([
    countFor(),
    ...statuses.map((status) => countFor(status)),
  ]);
  const [newCount, contacted, refused, closed] = perStatus;

  return { all, new: newCount, contacted, refused, closed };
}

/**
 * Loads every active listing (a minimal column set) by paging through the table,
 * so market analytics reflect the whole dataset rather than the rows that happen
 * to be paginated into the listings view.
 */
export async function fetchAllActiveListings(maxRows = 20000): Promise<Listing[]> {
  // latitude/longitude/listing_url sunt necesare hărții, care folosește același
  // set complet ca analiza vizuală (paginarea ar ascunde majoritatea punctelor).
  const columns = "id, title, price, currency, location, surface_sqm, seller_type, source, transaction_type, status, latitude, longitude, listing_url, date_scraped";
  const pageSize = 1000;
  const all: Partial<Listing>[] = [];
  for (let from = 0; from < maxRows; from += pageSize) {
    const to = from + pageSize - 1;
    const run = (includeDeletedFilter: boolean) => {
      let query = supabase.from("listings").select(columns);
      if (includeDeletedFilter) query = query.is("deleted_at", null);
      return query.order("date_scraped", { ascending: false }).range(from, to);
    };
    let { data, error } = await run(true);
    if (isMissingColumnError(error)) ({ data, error } = await run(false));
    if (error) throw error;
    const batch = (data ?? []) as Partial<Listing>[];
    all.push(...batch);
    if (batch.length < pageSize) break;
  }
  return all.map((listing) => ({
    ...listing,
    seller_type: listing.seller_type ?? "unknown",
    transaction_type: listing.transaction_type ?? "sale",
  })) as Listing[];
}

export interface DeletedListing extends Listing {
  deleted_at: string;
}

/**
 * Anunțurile din „coșul de gunoi": soft-deleted, cele mai recente primele.
 * Sunt șterse definitiv din baza de date la 30 de zile după `deleted_at`
 * (funcția `purge_expired_deleted_listings`, programată prin pg_cron).
 */
export async function fetchDeletedListings(maxRows = 2000): Promise<DeletedListing[]> {
  const columns = "id, title, price, currency, location, surface_sqm, image_url, seller_type, source, transaction_type, status, listing_url, date_scraped, deleted_at";
  const { data, error } = await supabase
    .from("listings")
    .select(columns)
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false })
    .limit(maxRows);
  if (error) throw error;
  return (data ?? []).map((listing) => ({
    ...listing,
    seller_type: listing.seller_type ?? "unknown",
    transaction_type: listing.transaction_type ?? "sale",
  })) as DeletedListing[];
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
  onUpdate: (listing: Listing) => void,
  /** Anunțul a fost soft-deleted (sau șters de alt client) — scoate-l din liste. */
  onRemove?: (id: string) => void
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
        // O ștergere e un UPDATE care setează deleted_at. Vechiul cod ieșea aici
        // cu `if (!isActiveListing) return`, deci anunțul rămânea în liste la
        // ștergerile venite prin realtime (inclusiv de la alt client).
        if (!isActiveListing(raw)) {
          if (raw && typeof raw.id === "string") onRemove?.(raw.id);
          return;
        }
        const updatedListing: Listing = {
          ...raw,
          seller_type: raw.seller_type ?? "unknown",
          transaction_type: raw.transaction_type ?? "sale",
        } as Listing;
        onUpdate(updatedListing);
      }
    )
    .on(
      "postgres_changes",
      { event: "DELETE", schema: "public", table: "listings" },
      (payload) => {
        const id = (payload.old as { id?: string } | null)?.id;
        if (id) onRemove?.(id);
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

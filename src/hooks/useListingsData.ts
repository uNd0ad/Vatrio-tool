import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchListingsPaginated,
  fetchListingCounts,
  fetchLastSuccessfulCrawl,
  subscribeToListings,
} from "../services/listings";
import type { ListingFilters, StatusCounts } from "../services/listings";
import type { Listing, ListingStatus } from "../types";
import { sendDesktopNotification } from "../utils/notifications";
import { playNewListingAlertSound } from "../utils/audioAlerts";
import { getAppSettings } from "../utils/appSettings";

const CACHE_KEY = "vatrio_cached_listings";

function readCachedListings(): Listing[] | null {
  const cached = localStorage.getItem(CACHE_KEY);
  if (!cached) return null;
  try {
    const parsed = JSON.parse(cached);
    return Array.isArray(parsed) ? (parsed as Listing[]) : null;
  } catch {
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
}

export interface UseListingsDataOptions {
  queryFilters: ListingFilters;
  transactionTypeFilter: "all" | "sale" | "rent";
  isOnline: boolean;
  pageSize?: number;
  /** Sincronizează alte zone de UI (ex. drawerul de detalii) la update-uri realtime. */
  onListingUpdated?: (listing: Listing) => void;
}

/**
 * Sursa de date a panoului de anunțuri: încărcare paginată cu fallback pe
 * cache-ul local, numărători pe statusuri și abonarea realtime la Supabase.
 */
export function useListingsData({
  queryFilters,
  transactionTypeFilter,
  isOnline,
  pageSize = 25,
  onListingUpdated,
}: UseListingsDataOptions) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [counts, setCounts] = useState<StatusCounts>({ all: 0, new: 0, contacted: 0, refused: 0, closed: 0 });
  const [lastSuccessfulCrawl, setLastSuccessfulCrawl] = useState<string | null>(null);
  const [realtimeNotification, setRealtimeNotification] = useState<string | null>(null);

  const onListingUpdatedRef = useRef(onListingUpdated);
  onListingUpdatedRef.current = onListingUpdated;

  // Authoritatively resync the status counts after a mutation this client made.
  const refreshCounts = useCallback(() => {
    void fetchListingCounts(transactionTypeFilter).then(setCounts).catch(() => {});
  }, [transactionTypeFilter]);

  const load = useCallback(async (background = false) => {
    background ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      let res;
      try {
        res = await fetchListingsPaginated(1, pageSize, queryFilters);
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 500));
        res = await fetchListingsPaginated(1, pageSize, queryFilters);
      }
      const [crawlTimestamp, statusCounts] = await Promise.all([
        fetchLastSuccessfulCrawl().catch(() => null),
        fetchListingCounts(transactionTypeFilter).catch(() => null),
      ]);
      setListings(res.data);
      setLastSuccessfulCrawl(crawlTimestamp);
      if (statusCounts) setCounts(statusCounts);
      setPage(1);
      setTotalCount(res.totalCount);
      setHasMore(res.hasMore);
      localStorage.setItem(CACHE_KEY, JSON.stringify(res.data));
    } catch (e) {
      const parsed = readCachedListings();
      if (parsed) {
        setListings(parsed);
        setTotalCount(parsed.length);
        setHasMore(false);
        const detail = e instanceof Error
          ? e.message
          : typeof e === "object" && e !== null && "message" in e
            ? String(e.message)
            : String(e);
        setError(`Nu s-au putut actualiza datele (${detail}). Se afișează anunțurile salvate local.`);
      } else {
        setError(e instanceof Error ? e.message : "Eroare la încărcare");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [queryFilters, pageSize, transactionTypeFilter]);

  const loadNextPage = useCallback(async () => {
    if (loadingMore || !hasMore || !isOnline) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await fetchListingsPaginated(nextPage, pageSize, queryFilters);
      setListings((prev) => [...prev, ...res.data.filter((item) => !prev.some((p) => p.id === item.id))]);
      setPage(nextPage);
      setTotalCount(res.totalCount);
      setHasMore(res.hasMore);
    } catch (e) {
      console.warn("Eroare la încărcarea paginii următoare:", e);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, isOnline, page, pageSize, queryFilters]);

  // Reload the first page whenever any filter changes; filtering is done
  // server-side so results and counts reflect the whole table, not just the
  // pages already loaded.
  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!isOnline) return;
    const unsubscribe = subscribeToListings(
      (newListing) => {
        let wasNew = false;
        setListings((current) => {
          wasNew = !current.some((i) => i.id === newListing.id);
          return wasNew
            ? [newListing, ...current]
            : current.map((i) => (i.id === newListing.id ? { ...i, ...newListing } : i));
        });
        if (wasNew) {
          setTotalCount((c) => c + 1);
          setCounts((c) => ({ ...c, all: c.all + 1, [newListing.status]: c[newListing.status] + 1 }));
          sendDesktopNotification(
            "Anunț nou Vatrio",
            `${newListing.title}${newListing.price ? ` — ${newListing.price} ${newListing.currency ?? "EUR"}` : ""}`
          );
          playNewListingAlertSound(getAppSettings().enableDesktopNotifications);
        }
        setRealtimeNotification(`Anunț nou primit în timp real: "${newListing.title.slice(0, 35)}..."`);
        setTimeout(() => setRealtimeNotification(null), 6000);
      },
      (updatedListing) => {
        let prevStatus: ListingStatus | undefined;
        setListings((current) => {
          prevStatus = current.find((item) => item.id === updatedListing.id)?.status;
          return current.map((item) => (item.id === updatedListing.id ? { ...item, ...updatedListing } : item));
        });
        if (prevStatus && prevStatus !== updatedListing.status) {
          setCounts((c) => ({
            ...c,
            [prevStatus!]: Math.max(0, c[prevStatus!] - 1),
            [updatedListing.status]: c[updatedListing.status] + 1,
          }));
        }
        onListingUpdatedRef.current?.(updatedListing);
      }
    );
    return () => unsubscribe();
  }, [isOnline]);

  return {
    listings, setListings,
    loading, refreshing,
    error, setError,
    hasMore, loadingMore,
    totalCount, setTotalCount,
    counts, setCounts,
    lastSuccessfulCrawl,
    realtimeNotification,
    load, loadNextPage, refreshCounts,
  };
}

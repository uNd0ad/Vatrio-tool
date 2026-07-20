import { useEffect, useMemo, useRef, useState } from "react";
import { signOut } from "../services/auth";
import { fetchListingsPaginated, fetchListingCounts, fetchLastSuccessfulCrawl, fetchListingDetails, fetchActivityLogs, updateListingNotes, updateListingStatus, subscribeToListings, bulkUpdateListingStatus, softDeleteListing } from "../services/listings";
import type { ListingFilters, StatusCounts } from "../services/listings";
import type { Listing, ListingStatus, SellerType, ActivityLog } from "../types";
import logoUrl from "../../favicon.png";
import { VisualAnalytics } from "./VisualAnalytics";
import { KanbanBoard } from "./KanbanBoard";
import { MapView } from "./MapView";
import UserManagement from "./UserManagement";
import { APP_VERSION } from "../version";
import olxLogo from "../assets/olx-logo.png";
import storiaLogo from "../assets/storia-logo.svg";
import imobiliareLogo from "../assets/imobiliare-logo.svg";
import { openUrl } from "@tauri-apps/plugin-opener";
import { getStarredListingIds, toggleStarredListing } from "../utils/favorites";
import { getSavedViews, saveView, deleteSavedView, type SavedViewFilter } from "../utils/savedViews";
import { sortListings, type SortConfig, type SortField } from "../utils/sorting";
import { requestNotificationPermission, sendDesktopNotification } from "../utils/notifications";
import { bulkUpdateStatus, bulkDeleteListings } from "../utils/bulkOperations";
import { calculateDaysOnMarket } from "../utils/daysOnMarket";
import { handleKeyboardShortcut } from "../utils/keyboardShortcuts";
import { getVirtualSlice } from "../utils/virtualizer";
import { ImageGallery } from "./ImageGallery";
import { formatPricePerSqm } from "../utils/pricePerSqm";
import { ComparisonModal } from "./ComparisonModal";
import { downloadCsvReport } from "../utils/exportListings";
import { DashboardSummary } from "./DashboardSummary";
import { enqueueOfflineChange, flushOfflineQueue, getPendingOfflineQueue } from "../utils/offlineSync";
import { pushUndoAction, popUndoAction } from "../utils/undoStack";
import { TableSkeleton } from "./TableSkeleton";
import { SettingsModal } from "./SettingsModal";
import { getColumnConfigs, saveColumnWidth, type ColumnConfig } from "../utils/columnConfig";
import { getTableDensity, saveTableDensity, type TableDensity } from "../utils/densityConfig";
import { ContextMenu } from "./ContextMenu";
import { openDetachedListingWindow } from "../utils/windowManager";
import { CommandPaletteModal } from "./CommandPaletteModal";
import { getSavedFilters, addSavedFilter, deleteSavedFilter, type SavedFilter } from "../utils/savedFilters";
import { PriceHistoryTimeline } from "./PriceHistoryTimeline";
import { printListingsPdf } from "../utils/printListings";
import { getNextFocusedRowIndex } from "../utils/tableKeyboardNav";

const STATUS_LABELS: Record<ListingStatus, string> = {
  new: "Nou",
  contacted: "Contactat",
  refused: "Refuzat",
  closed: "Închis",
};

const STATUS_ICONS: Record<ListingStatus, string> = {
  new: "●",
  contacted: "◐",
  refused: "×",
  closed: "✓",
};

type StatusFilter = ListingStatus | "all";

function formatPrice(listing: Listing) {
  if (listing.price === null) return "Preț indisponibil";
  return `${new Intl.NumberFormat("ro-RO").format(listing.price)} ${
    listing.currency ?? "EUR"
  }`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function truncateListingTitle(title: string, maxLength = 70) {
  if (title.length <= maxLength) return title;
  return `${title.slice(0, maxLength - 1).trimEnd()}…`;
}

function SourceMark({ source }: { source: Listing["source"] }) {
  if (source === "olx") {
    return <span className="source-logo olx"><img src={olxLogo} alt="OLX"/></span>;
  }
  if (source === "storia") {
    return <span className="source-logo storia"><img src={storiaLogo} alt="Storia"/></span>;
  }
  if (source === "imobiliare") {
    return <span className="source-logo imobiliare"><img src={imobiliareLogo} alt="Imobiliare"/></span>;
  }
  if (source === "homezz") {
    return <span className="source-logo" style={{ background: "#70b62c", color: "white", padding: "3px 8px", borderRadius: "6px", fontWeight: 700, fontSize: "11px" }}>HomeZZ</span>;
  }
  if (source === "publi24") {
    return <span className="source-logo" style={{ background: "#0066cc", color: "white", padding: "3px 8px", borderRadius: "6px", fontWeight: 700, fontSize: "11px" }}>Publi24</span>;
  }
  return <span className="source-logo default">{source}</span>;
}

async function openExternalUrl(url: string) {
  try {
    await openUrl(url);
  } catch {
    // Păstrează funcționarea și când interfața este testată direct în browser.
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

function Icon({ name }: { name: "grid" | "list" | "search" | "refresh" | "external" | "pin" | "close" | "sun" | "moon" }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
    list: <><path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    refresh: <><path d="M20 6v5h-5"/><path d="M19 11a8 8 0 1 0 1 5"/></>,
    external: <><path d="M15 3h6v6M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    close: <path d="m6 6 12 12M18 6 6 18"/>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></>,
    moon: <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

export default function ListingsTable({ userEmail, isMaster }: { userEmail: string; isMaster: boolean }) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sellerFilter, setSellerFilter] = useState<SellerType | "all">("all");
  const [selected, setSelected] = useState<Listing | null>(null);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [activeView, setActiveView] = useState<"listings" | "board" | "map" | "analytics">("listings");
  
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [realtimeNotification, setRealtimeNotification] = useState<string | null>(null);

  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [updatingBulk, setUpdatingBulk] = useState(false);

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [exportingClavium, setExportingClavium] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [counts, setCounts] = useState<StatusCounts>({ all: 0, new: 0, contacted: 0, refused: 0, closed: 0 });
  const [lastSuccessfulCrawl, setLastSuccessfulCrawl] = useState<string | null>(null);

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [hideDuplicates, setHideDuplicates] = useState(true);
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [minSqm, setMinSqm] = useState<number | "">("");
  const [maxSqm, setMaxSqm] = useState<number | "">("");
  const [dateRange, setDateRange] = useState<"all" | "24h" | "3d" | "7d">("all");
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<"all" | "sale" | "rent">("all");
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: "date_scraped", order: "desc" });

  const [starredIds, setStarredIds] = useState<Set<string>>(() => getStarredListingIds());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [savedViews, setSavedViews] = useState<SavedViewFilter[]>(() => getSavedViews());

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const queryFilters = useMemo<ListingFilters>(() => ({
    search: debouncedSearch,
    status: statusFilter,
    sellerType: sellerFilter,
    transactionType: transactionTypeFilter,
    minPrice: minPrice === "" ? null : minPrice,
    maxPrice: maxPrice === "" ? null : maxPrice,
    minSqm: minSqm === "" ? null : minSqm,
    maxSqm: maxSqm === "" ? null : maxSqm,
    dateRange,
    hideDuplicates,
    sortField: sortConfig.field,
    sortOrder: sortConfig.order,
  }), [debouncedSearch, statusFilter, sellerFilter, transactionTypeFilter, minPrice, maxPrice, minSqm, maxSqm, dateRange, hideDuplicates, sortConfig]);

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("vatrio_theme");
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("vatrio_theme", theme);
  }, [theme]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      void flushOfflineQueue(async (change) => {
        if (change.type === "status") {
          await updateListingStatus(change.listingId, change.value as ListingStatus, userEmail);
        } else if (change.type === "notes") {
          await updateListingNotes(change.listingId, change.value, userEmail);
        }
      }).then((count) => {
        if (count > 0) void load();
      });
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [userEmail]);

  useEffect(() => {
    if (!selected) {
      setActivityLogs([]);
      setNotes("");
      return;
    }
    setLoadingLogs(true);
    setLoadingDetails(true);

    fetchListingDetails(selected.id)
      .then((detail) => setNotes(detail.notes ?? ""))
      .catch(() => setNotes(selected.notes ?? ""))
      .finally(() => setLoadingDetails(false));

    fetchActivityLogs(selected.id)
      .then((logs) => setActivityLogs(logs))
      .catch(() => setActivityLogs([]))
      .finally(() => setLoadingLogs(false));
  }, [selected?.id]);


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
        }
        setRealtimeNotification(`Anunț nou primit în timp real: "${newListing.title.slice(0, 35)}..."`);
        setTimeout(() => setRealtimeNotification(null), 6000);
      },
      (updatedListing) => {
        setListings((current) =>
          current.map((item) => (item.id === updatedListing.id ? { ...item, ...updatedListing } : item))
        );
        setSelected((current) =>
          current?.id === updatedListing.id ? { ...current, ...updatedListing } : current
        );
      }
    );
    return () => unsubscribe();
  }, [isOnline]);

  function readCachedListings(): Listing[] | null {
    const cached = localStorage.getItem("vatrio_cached_listings");
    if (!cached) return null;
    try {
      const parsed = JSON.parse(cached);
      return Array.isArray(parsed) ? (parsed as Listing[]) : null;
    } catch {
      localStorage.removeItem("vatrio_cached_listings");
      return null;
    }
  }

  async function load(background = false) {
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
      localStorage.setItem("vatrio_cached_listings", JSON.stringify(res.data));
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
  }

  async function loadNextPage() {
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
  }

  // Reload the first page whenever any filter changes; filtering is done
  // server-side so results and counts reflect the whole table, not just the
  // pages already loaded.
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryFilters]);

  // Ask once for desktop-notification permission so realtime inserts can alert
  // the user even when the window is in the background.
  useEffect(() => {
    void requestNotificationPermission();
  }, []);

  // Global keyboard shortcuts: ⌘/Ctrl+K focuses search, ⌘/Ctrl+R refreshes,
  // 1–4 set the open listing's status, Escape closes the drawer.
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        const activeTag = (document.activeElement?.tagName || "").toUpperCase();
        if (activeTag !== "INPUT" && activeTag !== "TEXTAREA" && activeTag !== "SELECT") {
          e.preventDefault();
          setFocusedRowIndex((prev) => getNextFocusedRowIndex(prev, filtered.length, e.key as "ArrowUp" | "ArrowDown"));
          return;
        }
      }
      if (e.key === "Enter" && focusedRowIndex >= 0 && focusedRowIndex < filtered.length) {
        const activeTag = (document.activeElement?.tagName || "").toUpperCase();
        if (activeTag !== "INPUT" && activeTag !== "TEXTAREA" && activeTag !== "SELECT") {
          e.preventDefault();
          openDetails(filtered[focusedRowIndex]);
          return;
        }
      }
      handleKeyboardShortcut(e, {
        onSearch: () => setShowPalette(true),
        onRefresh: () => { if (isOnline) void load(true); },
        onEscape: () => setSelected(null),
        onSetStatus: (status) => { if (selected) void handleStatusChange(selected.id, status); },
        onUndo: () => { void handleUndoAction(); },
      });
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, selected, queryFilters, filtered, focusedRowIndex]);

  function handleToggleStar(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    toggleStarredListing(id);
    setStarredIds(getStarredListingIds());
  }

  function applySavedView(view: SavedViewFilter) {
    setSearch(view.location ?? "");
    setMaxPrice(view.maxPrice ?? "");
    setSellerFilter(
      view.sellerType && ["owner", "agency", "developer", "unknown"].includes(view.sellerType)
        ? (view.sellerType as SellerType)
        : "all"
    );
    setTransactionTypeFilter(
      view.transactionType === "sale" || view.transactionType === "rent" ? view.transactionType : "all"
    );
  }

  function handleSaveCurrentView() {
    const name = window.prompt("Denumește vizualizarea curentă:");
    if (!name?.trim()) return;
    const view = saveView({
      name: name.trim(),
      location: search.trim() || undefined,
      maxPrice: maxPrice === "" ? undefined : maxPrice,
      sellerType: sellerFilter !== "all" ? sellerFilter : undefined,
      transactionType: transactionTypeFilter !== "all" ? transactionTypeFilter : undefined,
    });
    setSavedViews((prev) => [...prev, view]);
  }

  function handleDeleteSavedView(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    deleteSavedView(id);
    setSavedViews(getSavedViews());
  }

  async function handleBulkDelete() {
    if (selectedRowIds.size === 0) return;
    if (!isOnline) {
      setError("Nu poți șterge anunțuri cât timp ești offline.");
      return;
    }
    const ids = Array.from(selectedRowIds);
    if (!window.confirm(`Ștergi ${ids.length} ${ids.length === 1 ? "anunț selectat" : "anunțuri selectate"}?`)) return;
    setUpdatingBulk(true);
    const previous = listings;
    setListings((current) => bulkDeleteListings(current, ids));
    setSelectedRowIds(new Set());
    try {
      const results = await Promise.allSettled(ids.map((id) => softDeleteListing(id)));
      const failed = results.filter((result) => result.status === "rejected").length;
      if (failed > 0) throw new Error(`${failed} anunțuri nu au putut fi șterse.`);
      setTotalCount((c) => Math.max(0, c - ids.length));
    } catch (e) {
      setListings(previous);
      setError(e instanceof Error ? e.message : "Ștergerea în masă a eșuat");
    } finally {
      setUpdatingBulk(false);
    }
  }


  async function handleClaviumExport(listing: Listing) {
    if (!isOnline) return;
    setExportingClavium(true);
    setExportSuccess(false);
    try {
      const response = await fetch("https://clavium.ro/api/listings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: listing.title,
          price: listing.price,
          currency: listing.currency,
          location: listing.location,
          property_type: listing.property_type,
          surface_sqm: listing.surface_sqm,
          image_url: listing.image_url,
          listing_url: listing.listing_url,
          source: listing.source,
          seller_type: listing.seller_type,
          notes: listing.notes,
        }),
      });

      if (!response.ok) {
        throw new Error(`Exportul a eșuat cu codul: ${response.status}`);
      }

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Exportul către Clavium a eșuat");
    } finally {
      setExportingClavium(false);
    }
  }

  // Filtering (search, ranges, status, seller, duplicates) and ordering are
  // applied server-side in fetchListingsPaginated. Favorites are a local-only
  // concept, so that overlay is applied here, and sortListings keeps the merged
  // pages consistently ordered as more are loaded.
  const filtered = useMemo(() => {
    const base = showFavoritesOnly ? listings.filter((l) => starredIds.has(l.id)) : listings;
    return sortListings(base, sortConfig);
  }, [listings, showFavoritesOnly, starredIds, sortConfig]);

  const [scrollTop, setScrollTop] = useState(0);
  const [tableContainerHeight, setTableContainerHeight] = useState(600);

  const virtualSlice = useMemo(() => {
    return getVirtualSlice({
      totalItems: filtered.length,
      itemHeight: 56,
      scrollTop,
      containerHeight: tableContainerHeight,
      overscan: 5,
    });
  }, [filtered.length, scrollTop, tableContainerHeight]);

  const visibleListings = useMemo(() => {
    if (filtered.length <= 30) return filtered;
    return filtered.slice(virtualSlice.startIndex, virtualSlice.endIndex);
  }, [filtered, virtualSlice]);

  const [showComparison, setShowComparison] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [columns, setColumns] = useState<ColumnConfig[]>(() => getColumnConfigs());
  const [density, setDensity] = useState<TableDensity>(() => getTableDensity());
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; listing: Listing } | null>(null);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(() => getSavedFilters());
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(-1);

  const comparisonListings = useMemo(() => {
    if (selectedRowIds.size === 0) return [];
    return listings.filter((l) => selectedRowIds.has(l.id)).slice(0, 3);
  }, [listings, selectedRowIds]);

  const allFilteredSelected = useMemo(() => {
    if (filtered.length === 0) return false;
    return filtered.every((item) => selectedRowIds.has(item.id));
  }, [filtered, selectedRowIds]);

  function toggleSelectAll() {
    if (allFilteredSelected) {
      setSelectedRowIds(new Set());
    } else {
      setSelectedRowIds(new Set(filtered.map((item) => item.id)));
    }
  }

  function toggleSelectRow(id: string, e: React.MouseEvent | React.ChangeEvent) {
    e.stopPropagation();
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleBulkStatusChange(targetStatus: ListingStatus) {
    if (selectedRowIds.size === 0) return;
    if (!isOnline) {
      setError("Nu poți modifica statusul în masă cât timp ești offline.");
      return;
    }
    const ids = Array.from(selectedRowIds);
    setUpdatingBulk(true);
    const previous = listings;
    setListings((current) => bulkUpdateStatus(current, ids, targetStatus));
    try {
      await bulkUpdateListingStatus(ids, targetStatus);
      setSelectedRowIds(new Set());
    } catch (e) {
      setListings(previous);
      setError(e instanceof Error ? e.message : "Actualizarea în masă a eșuat");
    } finally {
      setUpdatingBulk(false);
    }
  }

  async function handleUndoAction() {
    const action = popUndoAction();
    if (!action) return;
    if (action.type === "status" && action.previousStatus) {
      await handleStatusChange(action.listingId, action.previousStatus, true);
    }
  }

  async function handleStatusChange(id: string, status: ListingStatus, isUndo = false) {
    if (!isOnline) {
      enqueueOfflineChange("status", id, status);
      setListings((current) => current.map((item) => item.id === id ? { ...item, status } : item));
      return;
    }
    const previous = listings;
    const oldStatus = selected?.id === id ? selected.status : listings.find((item) => item.id === id)?.status;
    if (!isUndo && oldStatus && oldStatus !== status) {
      pushUndoAction({ type: "status", listingId: id, previousStatus: oldStatus });
    }
    setListings((current) => current.map((item) => item.id === id ? { ...item, status } : item));
    setSelected((current) => current?.id === id ? { ...current, status } : current);
    try {
      await updateListingStatus(id, status, oldStatus);
      if (selected?.id === id) {
        const logs = await fetchActivityLogs(id);
        setActivityLogs(logs);
      }
    } catch (e) {
      setListings(previous);
      setError(e instanceof Error ? e.message : "Statusul nu a putut fi salvat");
    }
  }

  function openDetails(listing: Listing) {
    setSelected(listing);
    setNotes(listing.notes ?? "");
  }

  async function saveNotes() {
    if (!selected) return;
    if (!isOnline) {
      setError("Nu poți salva notițele cât timp ești offline.");
      return;
    }
    setSavingNotes(true);
    setNotesSaved(false);
    try {
      const oldNotes = selected.notes;
      await updateListingNotes(selected.id, notes, oldNotes);
      setListings((current) => current.map((item) => item.id === selected.id ? { ...item, notes } : item));
      setSelected({ ...selected, notes });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 3000);
      const logs = await fetchActivityLogs(selected.id);
      setActivityLogs(logs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Notițele nu au putut fi salvate");
    } finally {
      setSavingNotes(false);
    }
  }

  const filters: Array<{ value: StatusFilter; label: string }> = [
    { value: "all", label: "Toate anunțurile" },
    { value: "new", label: "Noi" },
    { value: "contacted", label: "Contactate" },
    { value: "refused", label: "Refuzate" },
    { value: "closed", label: "Închise" },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><img src={logoUrl} alt=""/><div><strong>Vatrio</strong><span>Property CRM</span></div></div>
        <nav>
          <button className={`nav-item ${activeView === "listings" ? "active" : ""}`} onClick={() => setActiveView("listings")}><Icon name="grid"/>Panou general</button>
          <button className={`nav-item ${activeView === "board" ? "active" : ""}`} onClick={() => setActiveView("board")}><Icon name="list"/>Panou Kanban</button>
          <button className={`nav-item ${activeView === "map" ? "active" : ""}`} onClick={() => setActiveView("map")}><Icon name="pin"/>Hartă</button>
          <button className={`nav-item ${activeView === "analytics" ? "active" : ""}`} onClick={() => setActiveView("analytics")}><Icon name="list"/>Analiză vizuală</button>
          {isMaster && <button className="nav-item" onClick={() => setShowUsers(true)}><Icon name="grid"/>Utilizatori</button>}
        </nav>
        <div className="sidebar-section">
          <p>Status anunțuri</p>
          {filters.slice(1).map((filter) => (
            <button key={filter.value} className={`filter-link ${statusFilter === filter.value ? "selected" : ""}`} onClick={() => setStatusFilter(filter.value)}>
              <span className={`status-dot ${filter.value}`}/>{filter.label}<b>{counts[filter.value]}</b>
            </button>
          ))}
        </div>
        {savedFilters.length > 0 && (
          <div className="sidebar-section">
            <p>Dosare inteligente</p>
            {savedFilters.map((sf) => (
              <div key={sf.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 0' }}>
                <button
                  className="filter-link"
                  style={{ flex: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
                  onClick={() => {
                    setStatusFilter(sf.statusFilter);
                    setTransactionType(sf.transactionType);
                    setSearchQuery(sf.searchQuery);
                    setMinPrice(sf.minPrice);
                    setMaxPrice(sf.maxPrice);
                    setMinSqm(sf.minSqm);
                    setMaxSqm(sf.maxSqm);
                    setDateRange(sf.dateRange);
                  }}
                >
                  📁 {sf.name}
                </button>
                <button
                  onClick={() => setSavedFilters(deleteSavedFilter(sf.id))}
                  style={{ background: 'transparent', border: 0, color: '#94a3b8', cursor: 'pointer', fontSize: '12px' }}
                  title="Șterge dosar inteligent"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="sidebar-user"><span>{userEmail.charAt(0).toUpperCase()}</span><div><strong>{userEmail}</strong><small>Cont autentificat</small></div><button onClick={() => void signOut()} title="Deconectare" aria-label="Deconectare">↗</button></div>
        <div className="sidebar-footer" style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "stretch" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span className="online-dot"/>
            <div style={{ flex: 1 }}><strong>Supabase conectat</strong><small>Sincronizare activă</small></div>
            <button 
              onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))} 
              style={{
                background: "transparent",
                border: 0,
                color: "#778594",
                padding: "4px",
                display: "grid",
                placeItems: "center",
                cursor: "pointer"
              }}
              title={theme === "dark" ? "Mod luminos" : "Mod întunecat"}
              aria-label="Schimbă tema"
            >
              <Icon name={theme === "dark" ? "sun" : "moon"}/>
            </button>
            <button
              onClick={() => setShowSettings(true)}
              style={{
                background: "transparent",
                border: 0,
                color: "#778594",
                padding: "4px",
                fontSize: "14px",
                display: "grid",
                placeItems: "center",
                cursor: "pointer"
              }}
              title="Setări aplicație"
              aria-label="Setări aplicație"
            >
              ⚙
            </button>
          </div>
          <span className="app-version">v{APP_VERSION}</span>
        </div>
      </aside>

      <main className="main-content">
        {!isOnline && (
          <div className="error-banner" style={{ margin: "0 0 20px 0", background: "#fff9db", borderColor: "#f59f00", color: "#f59f00" }}>
            <span style={{ background: "#f59f00" }}>!</span>
            <p><strong>Mod Offline activ</strong>Se afișează anunțurile stocate în memoria cache. Modificările sunt dezactivate temporar.</p>
          </div>
        )}
        {realtimeNotification && (
          <div className="error-banner" style={{ margin: "0 0 20px 0", background: "var(--table-header-bg)", borderColor: "#20c997", color: "var(--text-main)" }}>
            <span style={{ background: "#20c997", color: "white" }}>✓</span>
            <p><strong>Sincronizare în timp real: </strong>{realtimeNotification}</p>
          </div>
        )}
        {activeView === "analytics" ? (
          <VisualAnalytics listings={listings} />
        ) : activeView === "board" ? (
          <>
            <header className="page-header">
              <div><p className="eyebrow">SPAȚIU DE LUCRU</p><h1>Panou Kanban</h1><p>Trage anunțurile prin etapele fluxului tău.</p></div>
              <button className="refresh-button" onClick={() => void load(true)} disabled={refreshing || !isOnline}><Icon name="refresh"/>{refreshing ? "Se actualizează..." : "Actualizează"}</button>
            </header>
            <div style={{ minHeight: "60vh" }}>
              <KanbanBoard listings={filtered} onStatusChange={(id, status) => void handleStatusChange(id, status)} onSelectListing={openDetails} />
            </div>
          </>
        ) : activeView === "map" ? (
          <>
            <header className="page-header">
              <div><p className="eyebrow">SPAȚIU DE LUCRU</p><h1>Hartă</h1><p>Vizualizează anunțurile după zonă și coordonate.</p></div>
              <button className="refresh-button" onClick={() => void load(true)} disabled={refreshing || !isOnline}><Icon name="refresh"/>{refreshing ? "Se actualizează..." : "Actualizează"}</button>
            </header>
            <div style={{ minHeight: "70vh", display: "flex" }}>
              <MapView listings={filtered} onSelectListing={openDetails} />
            </div>
          </>
        ) : (
          <>
            <header className="page-header">
              <div><p className="eyebrow">SPAȚIU DE LUCRU</p><h1>Panou anunțuri</h1><p>Urmărește și gestionează oportunitățile imobiliare.</p>{lastSuccessfulCrawl && <p className="crawl-freshness">Ultimul crawl reușit: {formatDate(lastSuccessfulCrawl)}</p>}</div>
              <button className="refresh-button" onClick={() => void load(true)} disabled={refreshing || !isOnline}><Icon name="refresh"/>{refreshing ? "Se actualizează..." : "Actualizează"}</button>
            </header>

        <section className="stats-grid">
          {(["all", "new", "contacted", "closed"] as StatusFilter[]).map((status) => {
            const labels = { all: "Total anunțuri", new: "Anunțuri noi", contacted: "Contactate", closed: "Finalizate", refused: "Refuzate" };
            const hints = { all: "în baza de date", new: "necesită evaluare", contacted: "în lucru", closed: "oportunități închise", refused: "nepotrivite" };
            return <button key={status} className={`stat-card ${statusFilter === status ? "active" : ""}`} onClick={() => setStatusFilter(status)}><span className={`stat-icon ${status}`}><Icon name={status === "all" ? "list" : "grid"}/></span><div><small>{labels[status]}</small><strong>{counts[status]}</strong><p>{hints[status]}</p></div></button>;
          })}
        </section>

        <div style={{
          display: "flex",
          gap: "4px",
          background: "var(--card-bg)",
          padding: "4px",
          borderRadius: "8px",
          border: "1px solid var(--panel-toolbar-border)",
          marginBottom: "20px",
          width: "fit-content"
        }}>
          {(["all", "sale", "rent"] as const).map((type) => {
            const labels = { all: "Toate", sale: "De Vânzare", rent: "De Închiriat" };
            const active = transactionTypeFilter === type;
            return (
              <button
                key={type}
                onClick={() => setTransactionTypeFilter(type)}
                style={{
                  padding: "7px 18px",
                  borderRadius: "7px",
                  border: 0,
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  background: active ? "linear-gradient(135deg, #1a73e8 0%, #1557b0 100%)" : "transparent",
                  color: active ? "white" : "var(--text-secondary)",
                  boxShadow: active ? "0 3px 10px rgba(26, 115, 232, 0.25)" : "none",
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                }}
              >
                {labels[type]}
              </button>
            );
          })}
        </div>

        <DashboardSummary
          listings={listings}
          statusCounts={counts}
          onFilterStatus={(status) => setStatusFilter(status)}
          onFilterNewToday={() => setDateRange("24h")}
        />

        <section className="list-panel">
          <div className="panel-toolbar">
            <div><h2>Anunțuri recente</h2><p>Se afișează {filtered.length} din {totalCount || listings.length} anunțuri</p></div>
            <div className="toolbar-actions">
              <label className="search-box"><Icon name="search"/><input ref={searchInputRef} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Caută titlu, zonă sau sursă... (⌘K)"/></label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}>{filters.map((filter) => <option key={filter.value} value={filter.value}>{filter.label}</option>)}</select>
              <select value={sellerFilter} onChange={(e) => setSellerFilter(e.target.value as SellerType | "all")}><option value="all">Toți vânzătorii</option><option value="owner">Proprietari</option><option value="agency">Agenții</option><option value="developer">Dezvoltatori</option><option value="unknown">Necunoscut</option></select>
              <select
                value={`${sortConfig.field}:${sortConfig.order}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split(":") as [SortField, "asc" | "desc"];
                  setSortConfig({ field, order });
                }}
                title="Ordonează anunțurile"
              >
                <option value="date_scraped:desc">Cele mai noi</option>
                <option value="date_scraped:asc">Cele mai vechi</option>
                <option value="price:asc">Preț crescător</option>
                <option value="price:desc">Preț descrescător</option>
                <option value="surface_sqm:desc">Suprafață (mare→mică)</option>
                <option value="surface_sqm:asc">Suprafață (mică→mare)</option>
                <option value="title:asc">Titlu (A→Z)</option>
              </select>
              <button
                onClick={() => setShowFavoritesOnly((value) => !value)}
                className="refresh-button"
                style={{ height: "35px", padding: "0 12px", border: "1px solid var(--button-border)", background: showFavoritesOnly ? "#fff3bf" : "var(--button-bg)", color: showFavoritesOnly ? "#d9480f" : "var(--button-color)" }}
                title={showFavoritesOnly ? "Se afișează doar anunțurile favorite." : "Afișează doar favoritele."}
              >
                {showFavoritesOnly ? "★ Doar favorite" : "☆ Favorite"}
              </button>
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="refresh-button"
                style={{ height: "35px", padding: "0 12px", border: "1px solid var(--button-border)", background: showAdvancedFilters ? "var(--sidebar-nav-active)" : "var(--button-bg)", color: showAdvancedFilters ? "white" : "var(--button-color)" }}
              >
                Filtre {showAdvancedFilters ? "▲" : "▼"}
              </button>
              <button 
                onClick={() => setHideDuplicates(!hideDuplicates)}
                className="refresh-button"
                style={{ height: "35px", padding: "0 12px", border: "1px solid var(--button-border)", background: hideDuplicates ? "var(--button-bg)" : "#fff3bf", color: hideDuplicates ? "var(--button-color)" : "#d9480f" }}
                title={hideDuplicates ? "Se ascund anunțurile duplicate. Apasă pentru a le afișa." : "Se afișează toate anunțurile, inclusiv duplicatele."}
              >
                {hideDuplicates ? "✓ Duplicate ascunse" : "Arată duplicatele"}
              </button>
              <button
                onClick={() => downloadCsvReport(filtered)}
                className="refresh-button"
                style={{ height: "35px", padding: "0 12px", border: "1px solid var(--button-border)", background: "var(--button-bg)", color: "var(--button-color)" }}
                title="Exportă lista curentă în format CSV / Excel pentru clienți"
              >
                📥 Exportă CSV
              </button>
              <button
                onClick={() => {
                  const next = density === "compact" ? "comfortable" : "compact";
                  saveTableDensity(next);
                  setDensity(next);
                }}
                className="refresh-button"
                style={{ height: "35px", padding: "0 12px", border: "1px solid var(--button-border)", background: density === "compact" ? "var(--sidebar-nav-active)" : "var(--button-bg)", color: density === "compact" ? "white" : "var(--button-color)" }}
                title={density === "compact" ? "Schimbă pe afișare lejeră" : "Schimbă pe afișare compactă"}
              >
                {density === "compact" ? "☰ Compact" : "☴ Lejer"}
              </button>
            </div>
          </div>

          {showAdvancedFilters && (
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "15px",
              padding: "16px 20px",
              background: "var(--table-header-bg)",
              borderBottom: "1px solid var(--panel-toolbar-border)",
              alignItems: "center"
            }}>
              <div style={{ flexBasis: "100%", display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)" }}>VIZUALIZĂRI:</span>
                {savedViews.map((view) => (
                  <span key={view.id} style={{ display: "inline-flex", alignItems: "center", gap: "2px", background: "var(--button-bg)", border: "1px solid var(--button-border)", borderRadius: "14px", padding: "2px 4px 2px 10px", fontSize: "11px" }}>
                    <button onClick={() => applySavedView(view)} style={{ background: "transparent", border: 0, color: "var(--button-color)", cursor: "pointer", fontWeight: 600, fontSize: "11px", padding: 0 }}>{view.name}</button>
                    <button onClick={(e) => handleDeleteSavedView(view.id, e)} title="Șterge vizualizarea" aria-label="Șterge vizualizarea" style={{ background: "transparent", border: 0, color: "var(--text-muted)", cursor: "pointer", lineHeight: 1, fontSize: "13px", padding: "0 4px" }}>×</button>
                  </span>
                ))}
                <button onClick={handleSaveCurrentView} style={{ background: "transparent", border: "1px dashed var(--button-border)", borderRadius: "14px", padding: "3px 12px", fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", cursor: "pointer" }}>+ Salvează filtrele curente</button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)" }}>PREȚ (€):</span>
                <input 
                  type="number" 
                  value={minPrice} 
                  onChange={(e) => setMinPrice(e.target.value ? parseInt(e.target.value, 10) : "")} 
                  placeholder="Min" 
                  style={{
                    width: "80px",
                    height: "30px",
                    padding: "0 8px",
                    border: "1px solid var(--button-border)",
                    borderRadius: "6px",
                    fontSize: "11px",
                    background: "var(--input-bg)",
                    color: "var(--input-color)"
                  }}
                />
                <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>-</span>
                <input 
                  type="number" 
                  value={maxPrice} 
                  onChange={(e) => setMaxPrice(e.target.value ? parseInt(e.target.value, 10) : "")} 
                  placeholder="Max" 
                  style={{
                    width: "80px",
                    height: "30px",
                    padding: "0 8px",
                    border: "1px solid var(--button-border)",
                    borderRadius: "6px",
                    fontSize: "11px",
                    background: "var(--input-bg)",
                    color: "var(--input-color)"
                  }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)" }}>SUPRAFAȚĂ (m²):</span>
                <input 
                  type="number" 
                  value={minSqm} 
                  onChange={(e) => setMinSqm(e.target.value ? parseInt(e.target.value, 10) : "")} 
                  placeholder="Min" 
                  style={{
                    width: "70px",
                    height: "30px",
                    padding: "0 8px",
                    border: "1px solid var(--button-border)",
                    borderRadius: "6px",
                    fontSize: "11px",
                    background: "var(--input-bg)",
                    color: "var(--input-color)"
                  }}
                />
                <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>-</span>
                <input 
                  type="number" 
                  value={maxSqm} 
                  onChange={(e) => setMaxSqm(e.target.value ? parseInt(e.target.value, 10) : "")} 
                  placeholder="Max" 
                  style={{
                    width: "70px",
                    height: "30px",
                    padding: "0 8px",
                    border: "1px solid var(--button-border)",
                    borderRadius: "6px",
                    fontSize: "11px",
                    background: "var(--input-bg)",
                    color: "var(--input-color)"
                  }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)" }}>PERIOADA:</span>
                <select 
                  value={dateRange} 
                  onChange={(e) => setDateRange(e.target.value as typeof dateRange)} 
                  style={{
                    height: "30px",
                    padding: "0 8px",
                    border: "1px solid var(--button-border)",
                    borderRadius: "6px",
                    fontSize: "11px",
                    background: "var(--button-bg)",
                    color: "var(--button-color)"
                  }}
                >
                  <option value="all">Toate perioadele</option>
                  <option value="24h">Ultimele 24 de ore</option>
                  <option value="3d">Ultimele 3 zile</option>
                  <option value="7d">Ultimele 7 zile</option>
                </select>
              </div>

              <button 
                onClick={() => {
                  const name = prompt("Numele dosarului inteligent (ex: Apartamente ieftine Cluj):");
                  if (!name || !name.trim()) return;
                  const updated = addSavedFilter({
                    name: name.trim(),
                    statusFilter,
                    transactionType,
                    searchQuery,
                    minPrice,
                    maxPrice,
                    minSqm,
                    maxSqm,
                    dateRange,
                  });
                  setSavedFilters(updated);
                }}
                style={{
                  height: "30px",
                  padding: "0 12px",
                  marginLeft: "auto",
                  background: "var(--button-bg)",
                  border: "1px solid var(--button-border)",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--button-color)",
                  cursor: "pointer"
                }}
              >
                💾 Salvează ca dosar inteligent
              </button>
              <button 
                onClick={() => {
                  setMinPrice("");
                  setMaxPrice("");
                  setMinSqm("");
                  setMaxSqm("");
                  setDateRange("all");
                }}
                style={{
                  height: "30px",
                  padding: "0 12px",
                  marginLeft: "6px",
                  background: "transparent",
                  border: 0,
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#d85b5b",
                  cursor: "pointer"
                }}
              >
                Resetează filtrele
              </button>
            </div>
          )}

          {error && <div className="error-banner"><span>!</span><p><strong>Nu am putut încărca datele</strong>{error}</p><button onClick={() => void load()}>Reîncearcă</button></div>}
          {loading ? <TableSkeleton rows={8} /> : filtered.length === 0 ? <div className="empty-state"><Icon name="search"/><h3>Niciun rezultat</h3><p>Încearcă alt termen de căutare sau schimbă filtrul.</p></div> : (
            <div
              className={`table-wrap ${density}`}
              onScroll={(e) => {
                setScrollTop(e.currentTarget.scrollTop);
                setTableContainerHeight(e.currentTarget.clientHeight);
              }}
            >
              <table>
                <thead>
                  <tr>
                    <th style={{ width: "36px", textAlign: "center" }}>
                      <input type="checkbox" checked={allFilteredSelected} onChange={toggleSelectAll} style={{ cursor: "pointer", width: "15px", height: "15px" }} aria-label="Selectează toate"/>
                    </th>
                    <th>PROPRIETATE</th>
                    <th>PREȚ</th>
                    <th>LOCAȚIE</th>
                    <th>SURSĂ</th>
                    <th>VÂNZĂTOR</th>
                    <th>ADĂUGAT</th>
                    <th>STATUS</th>
                    <th/>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length > 30 && virtualSlice.topPadding > 0 && (
                    <tr style={{ height: `${virtualSlice.topPadding}px` }}>
                      <td colSpan={9} style={{ padding: 0, border: 0 }} />
                    </tr>
                  )}
                  {visibleListings.map((listing) => {
                    const actualIndex = filtered.indexOf(listing);
                    const isFocused = actualIndex === focusedRowIndex;
                    return (
                      <tr
                        key={listing.id}
                        onClick={() => {
                          setFocusedRowIndex(actualIndex);
                          openDetails(listing);
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setFocusedRowIndex(actualIndex);
                          setContextMenu({ x: e.clientX, y: e.clientY, listing });
                        }}
                        style={{
                          background: selectedRowIds.has(listing.id)
                            ? "var(--sidebar-nav-active-bg, rgba(26, 115, 232, 0.08))"
                            : isFocused
                            ? "rgba(59, 130, 246, 0.12)"
                            : undefined,
                          outline: isFocused ? "1px dashed #3b82f6" : undefined,
                        }}
                      >
                      <td onClick={(e) => e.stopPropagation()} style={{ textAlign: "center" }}><input type="checkbox" checked={selectedRowIds.has(listing.id)} onChange={(e) => toggleSelectRow(listing.id, e)} style={{ cursor: "pointer", width: "15px", height: "15px" }} aria-label="Selectează anunț"/></td>
                      <td><div className="property-cell">{listing.image_url ? <img src={listing.image_url} alt=""/> : <div className="image-placeholder">V</div>}<div><strong>{truncateListingTitle(listing.title)}{listing.duplicate_of_id && <span className="seller-badge" style={{ background: "#fff3bf", color: "#d9480f", fontWeight: 700, fontSize: "10px", marginLeft: "6px" }} title="Acest anunț este identificat ca fiind duplicat">🔗 Duplicat</span>}</strong><span>{listing.transaction_type === "sale" ? "De vânzare" : "De închiriat"} · {listing.property_type ?? "Apartament"}{listing.surface_sqm ? ` · ${listing.surface_sqm} m²` : ""}</span></div></div></td>
                      <td className="price-cell">
                        <div>{formatPrice(listing)}</div>
                        {formatPricePerSqm(listing.price, listing.surface_sqm, listing.currency) && (
                          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 400, display: "block" }}>
                            {formatPricePerSqm(listing.price, listing.surface_sqm, listing.currency)}
                          </span>
                        )}
                      </td>
                      <td><span className="location-cell"><Icon name="pin"/>{listing.location ?? "Nespecificată"}</span></td>
                      <td><SourceMark source={listing.source}/></td>
                      <td><span className={`seller-badge ${listing.seller_type}`}>{listing.seller_type === "owner" ? "Proprietar" : listing.seller_type === "agency" ? "Agenție" : listing.seller_type === "developer" ? "Dezvoltator" : "Necunoscut"}</span></td>
                      <td className="date-cell">{formatDate(listing.date_scraped)}</td>
                      <td onClick={(e) => e.stopPropagation()}><label className={`status-select ${listing.status}`}><span>{STATUS_ICONS[listing.status]}</span><select value={listing.status} onChange={(e) => void handleStatusChange(listing.id, e.target.value as ListingStatus)}>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></td>
                      <td onClick={(e) => e.stopPropagation()} style={{ whiteSpace: "nowrap" }}>
                        <button className="external-link" onClick={(e) => handleToggleStar(listing.id, e)} aria-label={starredIds.has(listing.id) ? "Elimină din favorite" : "Adaugă la favorite"} title="Favorit" style={{ color: starredIds.has(listing.id) ? "#f59f00" : undefined, fontSize: "16px" }}>{starredIds.has(listing.id) ? "★" : "☆"}</button>
                        <button className="external-link" onClick={(e) => { e.stopPropagation(); void openExternalUrl(listing.listing_url); }} aria-label="Deschide anunțul"><Icon name="external"/></button>
                      </td>
                    );
                  })}
                  {filtered.length > 30 && virtualSlice.bottomPadding > 0 && (
                    <tr style={{ height: `${virtualSlice.bottomPadding}px` }}>
                      <td colSpan={9} style={{ padding: 0, border: 0 }} />
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {hasMore && (
            <div style={{ display: "flex", justifyContent: "center", padding: "20px 0 10px 0" }}>
              <button
                onClick={() => void loadNextPage()}
                disabled={loadingMore || !isOnline}
                className="refresh-button"
                style={{
                  padding: "10px 24px",
                  fontSize: "13px",
                  fontWeight: 600,
                  borderRadius: "8px",
                  background: "var(--sidebar-nav-active)",
                  color: "white",
                  border: 0,
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)"
                }}
              >
                {loadingMore ? "Se încarcă mai multe..." : `Încărcare mai multe (${listings.length} din ${totalCount})`}
              </button>
            </div>
          )}
        </section>


        {selectedRowIds.size > 0 && (
          <div style={{
            position: "fixed",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 100,
            background: "var(--card-bg, #ffffff)",
            border: "1px solid var(--panel-toolbar-border, #dce2e7)",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
            borderRadius: "12px",
            padding: "10px 18px",
            display: "flex",
            alignItems: "center",
            gap: "14px"
          }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>
              {selectedRowIds.size} {selectedRowIds.size === 1 ? "anunț selectat" : "anunțuri selectate"}
            </span>
            <div style={{ height: "18px", width: "1px", background: "var(--panel-toolbar-border)" }} />
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Schimbă status în:</span>
            {(["contacted", "refused", "closed", "new"] as ListingStatus[]).map((status) => (
              <button
                key={status}
                disabled={updatingBulk || !isOnline}
                onClick={() => void handleBulkStatusChange(status)}
                className="secondary-button"
                style={{
                  padding: "5px 12px",
                  borderRadius: "7px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <span>{STATUS_ICONS[status]}</span>
                {STATUS_LABELS[status]}
              </button>
            ))}
            <div style={{ height: "18px", width: "1px", background: "var(--panel-toolbar-border)" }} />
            <button
              disabled={updatingBulk || !isOnline}
              onClick={() => void handleBulkDelete()}
              className="secondary-button"
              style={{
                padding: "5px 12px",
                borderRadius: "7px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                color: "#d85b5b",
                borderColor: "#f0b0b0"
              }}
            >
              🗑 Șterge
            </button>
            {selectedRowIds.size >= 2 && selectedRowIds.size <= 3 && (
              <>
                <div style={{ height: "18px", width: "1px", background: "var(--panel-toolbar-border)" }} />
                <button
                  onClick={() => setShowComparison(true)}
                  className="secondary-button"
                  style={{
                    padding: "5px 12px",
                    borderRadius: "7px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    color: "#1a73e8",
                    borderColor: "#aecbfa",
                  }}
                >
                  🔍 Compară ({selectedRowIds.size})
                </button>
                <button
                  onClick={() => {
                    const selectedListings = listings.filter((l) => selectedRowIds.has(l.id));
                    printListingsPdf(selectedListings);
                  }}
                  className="secondary-button"
                  style={{
                    padding: "5px 12px",
                    borderRadius: "7px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    color: "var(--button-color)",
                    borderColor: "var(--button-border)",
                  }}
                >
                  🖨 Printează PDF
                </button>
              </>
            )}
            <button
              onClick={() => setSelectedRowIds(new Set())}
              style={{
                background: "transparent",
                border: 0,
                color: "var(--text-muted)",
                fontSize: "12px",
                cursor: "pointer",
                fontWeight: 600
              }}
            >
              Deselectează
            </button>
          </div>
        )}

        {showComparison && (
          <ComparisonModal
            listings={comparisonListings}
            onClose={() => setShowComparison(false)}
            onRemoveListing={(id) => {
              setSelectedRowIds((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
              });
            }}
          />
        )}
          </>
        )}
      </main>

      {selected && <><button className="drawer-backdrop" aria-label="Închide" onClick={() => setSelected(null)}/><aside className="detail-drawer">
        <button className="drawer-close" onClick={() => setSelected(null)}><Icon name="close"/></button>
        <ImageGallery primaryImageUrl={selected.image_url} images={selected.images} altText={selected.title} />
        <div className="drawer-badges"><SourceMark source={selected.source}/><span className={`seller-badge ${selected.seller_type}`}>{selected.seller_type === "owner" ? "Proprietar" : selected.seller_type === "agency" ? "Agenție" : selected.seller_type === "developer" ? "Dezvoltator" : "Necunoscut"}</span><span className="seller-badge" style={{ background: selected.transaction_type === "sale" ? "#e8f0fe" : "#f3e8ff", color: selected.transaction_type === "sale" ? "#1a73e8" : "#7c3aed", fontWeight: 800 }}>{selected.transaction_type === "sale" ? "De Vânzare" : "De Închiriat"}</span></div><h2>{selected.title}</h2><p className="drawer-price">{formatPrice(selected)}{formatPricePerSqm(selected.price, selected.surface_sqm, selected.currency) && <span style={{ fontSize: "13px", fontWeight: 400, color: "var(--text-muted)", marginLeft: "10px" }}>({formatPricePerSqm(selected.price, selected.surface_sqm, selected.currency)})</span>}</p><p className="drawer-location"><Icon name="pin"/>{selected.location ?? "Nespecificată"}</p>
        <p className="drawer-location" style={{ fontSize: "12px", color: "var(--text-muted)" }}>{calculateDaysOnMarket(selected.date_scraped)} zile pe piață · Adăugat {formatDate(selected.date_scraped)}</p>
        <PriceHistoryTimeline currentPrice={selected.price} currentCurrency={selected.currency} history={selected.price_history} />
        <button className="secondary-button" onClick={(e) => handleToggleStar(selected.id, e)} style={{ color: starredIds.has(selected.id) ? "#d9480f" : undefined, borderColor: starredIds.has(selected.id) ? "#f59f00" : undefined }}>{starredIds.has(selected.id) ? "★ Elimină din favorite" : "☆ Adaugă la favorite"}</button>
        <div className="drawer-divider"/><label className="field-label">Status</label><label className={`status-select large ${selected.status}`}><span>{STATUS_ICONS[selected.status]}</span><select value={selected.status} onChange={(e) => void handleStatusChange(selected.id, e.target.value as ListingStatus)}>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="field-label notes-label">Notițe interne {loadingDetails && <span style={{ fontSize: "11px", fontWeight: 400, color: "var(--text-muted)", marginLeft: "8px" }}>(Se încarcă...)</span>}</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => void saveNotes()} placeholder={loadingDetails ? "Se încarcă notițele..." : "Adaugă observații despre această proprietate..."} rows={6} disabled={loadingDetails}/>
        <button className="primary-button" onClick={() => void saveNotes()} disabled={savingNotes || !isOnline}>{savingNotes ? "Se salvează..." : notesSaved ? "✓ Notițe salvate!" : "Salvează notițele"}</button>
        <button className="secondary-button" onClick={() => void openExternalUrl(selected.listing_url)}>Vezi anunțul original <Icon name="external"/></button>
        <button className="secondary-button" style={{ marginTop: "8px", borderColor: exportSuccess ? "#2b8a3e" : "#dce2e7", color: exportSuccess ? "#2b8a3e" : "#44515d" }} onClick={() => void handleClaviumExport(selected)} disabled={exportingClavium || !isOnline}>
          {exportingClavium ? "Se trimite..." : exportSuccess ? "✓ Trimis la Clavium!" : "Trimite la Clavium"} <Icon name="external"/>
        </button>
        <button className="secondary-button" style={{ marginTop: "8px" }} onClick={() => void openDetachedListingWindow(selected.id, selected.title)}>
          Deschide în fereastră nouă ⧉
        </button>

        <div className="drawer-divider"/>
        <label className="field-label">Istoric Activitate</label>
        {loadingLogs ? (
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0" }}>Se încarcă istoricul...</p>
        ) : activityLogs.length === 0 ? (
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0" }}>Nicio activitate înregistrată încă.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px", maxHeight: "200px", overflowY: "auto" }}>
            {activityLogs.map((log) => (
              <div key={log.id} style={{ fontSize: "12px", background: "var(--table-header-bg)", padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--panel-toolbar-border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <strong style={{ color: "var(--text-main)", fontWeight: 600 }}>{log.user_email}</strong>
                  <small style={{ color: "var(--text-muted)" }}>{formatDate(log.created_at)}</small>
                </div>
                <p style={{ margin: 0, color: "var(--text-secondary)" }}>
                  {log.action === "status_change" ? (
                    <>Status modificat: <strong>{STATUS_LABELS[log.old_value as ListingStatus] || log.old_value || "Nou"}</strong> → <strong>{STATUS_LABELS[log.new_value as ListingStatus] || log.new_value}</strong></>
                  ) : log.action === "notes_update" ? (
                    <>Notițe interne actualizate</>
                  ) : (
                    <>{log.action}</>
                  )}
                </p>
              </div>
            ))}
          </div>
        )}
      </aside></>}
      {showUsers && <UserManagement onClose={() => setShowUsers(false)}/>} 
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} onSettingsSaved={() => void load()} />}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          listing={contextMenu.listing}
          isStarred={starredIds.has(contextMenu.listing.id)}
          onClose={() => setContextMenu(null)}
          onOpenDetails={openDetails}
          onToggleStar={(id) => handleToggleStar(id, { stopPropagation: () => {} } as any)}
          onStatusChange={(id, status) => void handleStatusChange(id, status)}
          onOpenExternal={(url) => void openExternalUrl(url)}
          onDelete={(id) => {
            setSelectedRowIds(new Set([id]));
            void handleBulkDelete();
          }}
        />
      {showPalette && (
        <CommandPaletteModal
          onClose={() => setShowPalette(false)}
          listings={listings}
          onSelectListing={openDetails}
          onNavigateView={(v) => setActiveView(v)}
          onOpenSettings={() => setShowSettings(true)}
          onToggleTheme={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
        />
      )}
    </div>
  );
}

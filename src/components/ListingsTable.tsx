import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchAllActiveListings,
  fetchListingDetails,
  fetchActivityLogs,
  updateListingNotes,
  updateListingStatus,
  bulkUpdateListingStatus,
  softDeleteListing,
} from "../services/listings";
import type { Listing, ListingStatus, SellerType, ActivityLog } from "../types";
import { VisualAnalytics } from "./VisualAnalytics";
import { KanbanBoard } from "./KanbanBoard";
import { MapView } from "./MapView";
import UserManagement from "./UserManagement";
import { APP_VERSION } from "../version";
import { getStarredListingIds, toggleStarredListing } from "../utils/favorites";
import { getSavedViews, saveView, deleteSavedView, type SavedViewFilter } from "../utils/savedViews";
import { sortListings, type SortField } from "../utils/sorting";
import { requestNotificationPermission } from "../utils/notifications";
import { bulkUpdateStatus, bulkDeleteListings } from "../utils/bulkOperations";
import { handleKeyboardShortcut } from "../utils/keyboardShortcuts";
import { getVirtualSlice } from "../utils/virtualizer";
import { formatDate } from "../utils/format";
import { ComparisonModal } from "./ComparisonModal";
import { DashboardSummary } from "./DashboardSummary";
import { enqueueOfflineChange, flushOfflineQueue } from "../utils/offlineSync";
import { pushUndoAction, popUndoAction } from "../utils/undoStack";
import { TableSkeleton } from "./TableSkeleton";
import { SettingsModal } from "./SettingsModal";
import { getTableDensity, saveTableDensity, type TableDensity } from "../utils/densityConfig";
import { ContextMenu } from "./ContextMenu";
import { CommandPaletteModal } from "./CommandPaletteModal";
import { getSavedFilters, addSavedFilter, deleteSavedFilter, type SavedFilter } from "../utils/savedFilters";
import { printListingsPdf } from "../utils/printListings";
import { openExternalUrl } from "../utils/externalUrl";
import { getNextFocusedRowIndex } from "../utils/tableKeyboardNav";
import { ExportModal } from "./ExportModal";
import { sortListingsMultiColumn } from "../utils/multiColumnSort";
import { applyQuickFilter, type QuickFilterType } from "../utils/quickFilters";
import { Breadcrumbs } from "./Breadcrumbs";
import { initWindowStateListener } from "../utils/windowState";
import { saveCurrentMonitorInfo } from "../utils/multiMonitor";
import { updateSystemTrayStatus } from "../utils/systemTray";
import { ChangelogModal } from "./ChangelogModal";
import { FeatureTooltip } from "./FeatureTooltip";
import { Icon } from "./Icon";
import { Sidebar, type ActiveView } from "./Sidebar";
import { CrawlActions } from "./CrawlActions";
import { ListingCard } from "./ListingCard";
import { MobileNav } from "./MobileNav";
import { DeletedListings } from "./DeletedListings";
import { AdvancedFiltersPanel } from "./AdvancedFiltersPanel";
import { BulkActionsBar } from "./BulkActionsBar";
import { ListingRow } from "./ListingRow";
import { ListingDetailDrawer } from "./ListingDetailDrawer";
import { useTheme } from "../hooks/useTheme";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { useListingFilters } from "../hooks/useListingFilters";
import { useListingsData } from "../hooks/useListingsData";
import { useIsMobile } from "../hooks/useMediaQuery";
import type { StatusFilter } from "../utils/listingDisplay";

const LAST_SEEN_VERSION_KEY = "vatrio_last_seen_version";

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "Toate anunțurile" },
  { value: "new", label: "Noi" },
  { value: "contacted", label: "Contactate" },
  { value: "refused", label: "Refuzate" },
  { value: "closed", label: "Închise" },
];

export default function ListingsTable({ userEmail, isMaster }: { userEmail: string; isMaster: boolean }) {
  const filters = useListingFilters();
  const { theme, toggleTheme } = useTheme();
  const isMobile = useIsMobile();

  const [selected, setSelected] = useState<Listing | null>(null);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [showUsers, setShowUsers] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>("listings");

  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [updatingBulk, setUpdatingBulk] = useState(false);
  const [exportingClavium, setExportingClavium] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(-1);

  // Setul complet de anunțuri active, folosit de vederile care trebuie să
  // acopere toată baza, nu doar pagina curentă (analiză vizuală și hartă).
  const [fullDataset, setFullDataset] = useState<Listing[] | null>(null);
  const [fullDatasetLoading, setFullDatasetLoading] = useState(false);

  const [starredIds, setStarredIds] = useState<Set<string>>(() => getStarredListingIds());
  const [savedViews, setSavedViews] = useState<SavedViewFilter[]>(() => getSavedViews());
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(() => getSavedFilters());

  // Mesaj tranzitoriu de confirmare pentru acțiuni care altfel n-ar da niciun
  // semn (ștergerea doar făcea anunțul să dispară, fără feedback).
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function showNotice(message: string) {
    setNotice(message);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 5000);
  }

  const [showComparison, setShowComparison] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [density, setDensity] = useState<TableDensity>(() => getTableDensity());
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; listing: Listing } | null>(null);

  const [scrollTop, setScrollTop] = useState(0);
  const [tableContainerHeight, setTableContainerHeight] = useState(600);

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const dataRef = useRef<{ load: (background?: boolean) => Promise<void> } | null>(null);

  const isOnline = useOnlineStatus(() => {
    void flushOfflineQueue(async (change) => {
      if (change.type === "status") {
        await updateListingStatus(change.listingId, change.value as ListingStatus);
      } else if (change.type === "notes") {
        await updateListingNotes(change.listingId, change.value, userEmail);
      }
    }).then((count) => {
      if (count > 0) void dataRef.current?.load();
    });
  });

  const data = useListingsData({
    queryFilters: filters.queryFilters,
    transactionTypeFilter: filters.transactionTypeFilter,
    isOnline,
    onListingUpdated: (updated) =>
      setSelected((current) => (current?.id === updated.id ? { ...current, ...updated } : current)),
  });
  dataRef.current = data;
  const {
    listings, setListings,
    loading, refreshing,
    error, setError,
    hasMore, loadingMore,
    totalCount, setTotalCount,
    counts,
    lastSuccessfulCrawl,
    realtimeNotification,
    load, loadNextPage, refreshCounts,
  } = data;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  // Ask once for desktop-notification permission so realtime inserts can alert
  // the user even when the window is in the background.
  useEffect(() => {
    void requestNotificationPermission();
    saveCurrentMonitorInfo();
    return initWindowStateListener();
  }, []);

  // Changelogul se deschide o singură dată după fiecare update de versiune.
  useEffect(() => {
    if (localStorage.getItem(LAST_SEEN_VERSION_KEY) !== APP_VERSION) {
      setShowChangelog(true);
    }
  }, []);

  // Analiza și harta rezumă întreg tabelul, nu rândurile paginate, deci aduc
  // setul complet de anunțuri active când se deschide una dintre vederi.
  useEffect(() => {
    if (activeView !== "analytics" && activeView !== "map") return;
    let cancelled = false;
    setFullDatasetLoading(true);
    fetchAllActiveListings()
      .then((all) => { if (!cancelled) setFullDataset(all); })
      .catch(() => {
        if (!cancelled) {
          setFullDataset((prev) => prev ?? []);
          setError("Nu s-au putut încărca toate datele. Se afișează ultimul set disponibil.");
        }
      })
      .finally(() => { if (!cancelled) setFullDatasetLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView]);

  useEffect(() => {
    updateSystemTrayStatus(isOnline ? "Supabase Conectat" : "Offline", counts.new);
  }, [isOnline, counts.new]);

  // Filtering (search, ranges, status, seller, duplicates) and ordering are
  // applied server-side in fetchListingsPaginated. Favorites are a local-only
  // concept, so that overlay is applied here, and sortListings keeps the merged
  // pages consistently ordered as more are loaded.
  const filtered = useMemo(() => {
    const base = filters.showFavoritesOnly ? listings.filter((l) => starredIds.has(l.id)) : listings;
    const quickFiltered = applyQuickFilter(base, filters.quickFilter);
    const sortedPrimary = sortListings(quickFiltered, filters.sortConfig);
    return sortListingsMultiColumn(sortedPrimary, [{ field: filters.sortConfig.field as SortField, direction: filters.sortConfig.order }]);
  }, [listings, filters.showFavoritesOnly, starredIds, filters.sortConfig, filters.quickFilter]);

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

  const comparisonListings = useMemo(() => {
    if (selectedRowIds.size === 0) return [];
    return listings.filter((l) => selectedRowIds.has(l.id)).slice(0, 3);
  }, [listings, selectedRowIds]);

  const allFilteredSelected = useMemo(() => {
    if (filtered.length === 0) return false;
    return filtered.every((item) => selectedRowIds.has(item.id));
  }, [filtered, selectedRowIds]);

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
  }, [isOnline, selected, filters.queryFilters, filtered, focusedRowIndex]);

  function handleToggleStar(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    toggleStarredListing(id);
    setStarredIds(getStarredListingIds());
  }

  function handleSaveCurrentView() {
    const name = window.prompt("Denumește vizualizarea curentă:");
    if (!name?.trim()) return;
    const view = saveView({
      name: name.trim(),
      location: filters.search.trim() || undefined,
      maxPrice: filters.maxPrice === "" ? undefined : filters.maxPrice,
      sellerType: filters.sellerFilter !== "all" ? filters.sellerFilter : undefined,
      transactionType: filters.transactionTypeFilter !== "all" ? filters.transactionTypeFilter : undefined,
    });
    setSavedViews((prev) => [...prev, view]);
  }

  function handleDeleteSavedView(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    deleteSavedView(id);
    setSavedViews(getSavedViews());
  }

  function handleSaveSmartFolder() {
    const name = prompt("Numele dosarului inteligent (ex: Apartamente ieftine Cluj):");
    if (!name || !name.trim()) return;
    const updated = addSavedFilter({
      name: name.trim(),
      statusFilter: filters.statusFilter,
      transactionType: filters.transactionTypeFilter,
      searchQuery: filters.search,
      minPrice: String(filters.minPrice),
      maxPrice: String(filters.maxPrice),
      minSqm: String(filters.minSqm),
      maxSqm: String(filters.maxSqm),
      dateRange: filters.dateRange,
    });
    setSavedFilters(updated);
  }

  /**
   * Primește explicit ce se șterge. Varianta anterioară citea `selectedRowIds`,
   * iar meniul contextual apela `setSelectedRowIds(...)` urmat imediat de
   * ștergere: actualizarea de stare nu e sincronă, deci funcția vedea selecția
   * veche — nu ștergea nimic când nu era nimic selectat și ștergea alte
   * anunțuri când era.
   */
  async function handleDeleteListings(ids: string[]) {
    if (ids.length === 0) return;
    if (!isOnline) {
      setError("Nu poți șterge anunțuri cât timp ești offline.");
      return;
    }
    if (!window.confirm(`Ștergi ${ids.length} ${ids.length === 1 ? "anunț" : "anunțuri"}?`)) return;
    setUpdatingBulk(true);
    const previous = listings;
    setListings((current) => bulkDeleteListings(current, ids));
    setSelectedRowIds((current) => {
      const next = new Set(current);
      for (const id of ids) next.delete(id);
      return next;
    });
    // Drawerul rămâne deschis pe un anunț tocmai șters dacă nu îl închidem.
    setSelected((current) => (current && ids.includes(current.id) ? null : current));
    try {
      const results = await Promise.allSettled(ids.map((id) => softDeleteListing(id)));
      const failed = results.filter((result) => result.status === "rejected").length;
      if (failed > 0) throw new Error(`${failed} anunțuri nu au putut fi șterse.`);
      setTotalCount((c) => Math.max(0, c - ids.length));
      refreshCounts();
      showNotice(
        ids.length === 1
          ? "Anunț mutat în Șterse. Poate fi restaurat 30 de zile."
          : `${ids.length} anunțuri mutate în Șterse. Pot fi restaurate 30 de zile.`
      );
    } catch (e) {
      setListings(previous);
      setError(e instanceof Error ? e.message : "Ștergerea a eșuat");
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
      refreshCounts();
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
      if (oldStatus && oldStatus !== status) refreshCounts();
      if (selected?.id === id) {
        const logs = await fetchActivityLogs(id);
        setActivityLogs(logs);
      }
    } catch (e) {
      setListings(previous);
      setSelected((current) => (current?.id === id && oldStatus ? { ...current, status: oldStatus } : current));
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

  function handleUpdateTags(tags: string[]) {
    if (!selected) return;
    setSelected({ ...selected, tags });
    setListings((prev) => prev.map((l) => (l.id === selected.id ? { ...l, tags } : l)));
  }

  return (
    <div className={`app-shell ${isMobile ? "mobile" : ""}`}>
      <Sidebar
        userEmail={userEmail}
        isMaster={isMaster}
        activeView={activeView}
        showFavoritesOnly={filters.showFavoritesOnly}
        starredCount={starredIds.size}
        statusFilter={filters.statusFilter}
        counts={counts}
        savedFilters={savedFilters}
        theme={theme}
        onNavigate={(view, favoritesOnly) => {
          setActiveView(view);
          filters.setShowFavoritesOnly(favoritesOnly);
        }}
        onShowUsers={() => setShowUsers(true)}
        onStatusFilter={filters.setStatusFilter}
        onApplySavedFilter={filters.applySavedFilter}
        onDeleteSavedFilter={(id) => {
          deleteSavedFilter(id);
          setSavedFilters(getSavedFilters());
        }}
        onToggleTheme={toggleTheme}
        onShowSettings={() => setShowSettings(true)}
      />

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
        {notice && (
          <div className="error-banner" style={{ margin: "0 0 20px 0", background: "var(--table-header-bg)", borderColor: "#20c997", color: "var(--text-main)" }}>
            <span style={{ background: "#20c997", color: "white" }}>✓</span>
            <p>{notice}</p>
          </div>
        )}
        {activeView === "trash" ? (
          <DeletedListings isOnline={isOnline} onRestored={() => void load(true)} />
        ) : activeView === "analytics" ? (
          <>
            {error && <div className="error-banner"><span>!</span><p><strong>Nu am putut încărca datele</strong>{error}</p></div>}
            {fullDatasetLoading && !fullDataset ? (
              <div className="loading-state"><div className="spinner"/><p>Se încarcă datele pentru analiză...</p></div>
            ) : (
              <VisualAnalytics listings={fullDataset ?? []} />
            )}
          </>
        ) : activeView === "board" ? (
          <>
            <header className="page-header">
              <div><p className="eyebrow">SPAȚIU DE LUCRU</p><h1>Panou Kanban</h1><p>Trage anunțurile prin etapele fluxului tău.</p></div>
              <CrawlActions onReload={() => void load(true)} reloading={refreshing} isOnline={isOnline} />
            </header>
            <div style={{ minHeight: "60vh" }}>
              <KanbanBoard listings={filtered} onStatusChange={(id, status) => void handleStatusChange(id, status)} onSelectListing={openDetails} />
            </div>
          </>
        ) : activeView === "map" ? (
          <>
            <header className="page-header">
              <div><p className="eyebrow">SPAȚIU DE LUCRU</p><h1>Hartă</h1><p>Vizualizează anunțurile după zonă și coordonate.</p></div>
              <CrawlActions onReload={() => void load(true)} reloading={refreshing} isOnline={isOnline} />
            </header>
            <div style={{ minHeight: "70vh", display: "flex" }}>
              {fullDatasetLoading && !fullDataset ? (
                <div className="loading-state"><div className="spinner"/><p>Se încarcă anunțurile pentru hartă...</p></div>
              ) : (
                <MapView listings={fullDataset ?? []} onSelectListing={openDetails} />
              )}
            </div>
          </>
        ) : (
          <>
            <header className="page-header">
              <div><p className="eyebrow">SPAȚIU DE LUCRU</p><h1>Panou anunțuri</h1><p>Urmărește și gestionează oportunitățile imobiliare.</p>{lastSuccessfulCrawl && <p className="crawl-freshness">Ultimul crawl reușit: {formatDate(lastSuccessfulCrawl)}</p>}</div>
              <CrawlActions onReload={() => void load(true)} reloading={refreshing} isOnline={isOnline} />
            </header>

        <section className="stats-grid">
          {(["all", "new", "contacted", "closed"] as StatusFilter[]).map((status) => {
            const labels = { all: "Total anunțuri", new: "Anunțuri noi", contacted: "Contactate", closed: "Finalizate", refused: "Refuzate" };
            const hints = { all: "în baza de date", new: "necesită evaluare", contacted: "în lucru", closed: "oportunități închise", refused: "nepotrivite" };
            return <button key={status} className={`stat-card ${filters.statusFilter === status ? "active" : ""}`} onClick={() => filters.setStatusFilter(status)}><span className={`stat-icon ${status}`}><Icon name={status === "all" ? "list" : "grid"}/></span><div><small>{labels[status]}</small><strong>{counts[status]}</strong><p>{hints[status]}</p></div></button>;
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
            const active = filters.transactionTypeFilter === type;
            return (
              <button
                key={type}
                onClick={() => filters.setTransactionTypeFilter(type)}
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
          onFilterNewToday={() => filters.setDateRange("24h")}
        />

        <section className="list-panel">
          <div className="panel-toolbar">
            <div>
              <Breadcrumbs
                items={[
                  { label: "Vatrio", onClick: () => setActiveView("listings") },
                  { label: "Panou general" },
                  ...(selected ? [{ label: selected.title.slice(0, 25) + "..." }] : [])
                ]}
              />
              <h2 style={{ marginTop: "4px" }}>Anunțuri recente</h2>
              <p>Se afișează {filtered.length} din {totalCount || listings.length} anunțuri</p>
            </div>
            <div className="toolbar-actions">
              <FeatureTooltip id="cmd-k-tip" title="Căutare Rapidă" description="Apasă ⌘K sau Ctrl+K oricând pentru paleta de comenzi">
                <label className="search-box"><Icon name="search"/><input ref={searchInputRef} value={filters.search} onChange={(e) => filters.setSearch(e.target.value)} placeholder="Caută titlu, zonă sau sursă... (⌘K)"/></label>
              </FeatureTooltip>
              <select value={filters.statusFilter} onChange={(e) => filters.setStatusFilter(e.target.value as StatusFilter)}>{STATUS_OPTIONS.map((filter) => <option key={filter.value} value={filter.value}>{filter.label}</option>)}</select>
              <select value={filters.sellerFilter} onChange={(e) => filters.setSellerFilter(e.target.value as SellerType | "all")}><option value="all">Toți vânzătorii</option><option value="owner">Proprietari</option><option value="agency">Agenții</option><option value="developer">Dezvoltatori</option><option value="unknown">Necunoscut</option></select>
              <select
                value={`${filters.sortConfig.field}:${filters.sortConfig.order}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split(":") as [SortField, "asc" | "desc"];
                  filters.setSortConfig({ field, order });
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
                onClick={() => filters.setShowFavoritesOnly(!filters.showFavoritesOnly)}
                className="refresh-button"
                style={{ height: "35px", padding: "0 12px", border: "1px solid var(--button-border)", background: filters.showFavoritesOnly ? "#fff3bf" : "var(--button-bg)", color: filters.showFavoritesOnly ? "#d9480f" : "var(--button-color)" }}
                title={filters.showFavoritesOnly ? "Se afișează doar anunțurile favorite." : "Afișează doar favoritele."}
              >
                {filters.showFavoritesOnly ? "★ Doar favorite" : "☆ Favorite"}
              </button>
              <button
                onClick={() => filters.setShowAdvancedFilters(!filters.showAdvancedFilters)}
                className="refresh-button"
                style={{ height: "35px", padding: "0 12px", border: "1px solid var(--button-border)", background: filters.showAdvancedFilters ? "var(--sidebar-nav-active)" : "var(--button-bg)", color: filters.showAdvancedFilters ? "white" : "var(--button-color)" }}
              >
                Filtre {filters.showAdvancedFilters ? "▲" : "▼"}
              </button>
              <button
                onClick={() => filters.setHideDuplicates(!filters.hideDuplicates)}
                className="refresh-button"
                style={{ height: "35px", padding: "0 12px", border: "1px solid var(--button-border)", background: filters.hideDuplicates ? "var(--button-bg)" : "#fff3bf", color: filters.hideDuplicates ? "var(--button-color)" : "#d9480f" }}
                title={filters.hideDuplicates ? "Se ascund anunțurile duplicate. Apasă pentru a le afișa." : "Se afișează toate anunțurile, inclusiv duplicatele."}
              >
                {filters.hideDuplicates ? "✓ Duplicate ascunse" : "Arată duplicatele"}
              </button>
              <button
                onClick={() => setShowExportModal(true)}
                className="refresh-button"
                style={{ height: "35px", padding: "0 12px", border: "1px solid var(--button-border)", background: "var(--button-bg)", color: "var(--button-color)" }}
                title="Exportă lista curentă (CSV, Excel, JSON, PDF)"
              >
                📥 Exportă
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

          <div style={{ display: "flex", gap: "8px", padding: "8px 20px", background: "var(--card-bg)", borderBottom: "1px solid var(--panel-toolbar-border)", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>Filtre rapide:</span>
            {[
              { id: "all", label: "Toate" },
              { id: "new_today", label: "⚡ Noi azi" },
              { id: "price_dropped", label: "📉 Preț redus" },
              { id: "below_average", label: "🏷 Sub media pieței" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => filters.setQuickFilter(f.id as QuickFilterType)}
                style={{
                  padding: "3px 10px",
                  borderRadius: "14px",
                  fontSize: "12px",
                  fontWeight: 600,
                  border: "1px solid var(--button-border)",
                  background: filters.quickFilter === f.id ? "var(--sidebar-nav-active)" : "var(--button-bg)",
                  color: filters.quickFilter === f.id ? "white" : "var(--button-color)",
                  cursor: "pointer",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filters.showAdvancedFilters && (
            <AdvancedFiltersPanel
              filters={filters}
              savedViews={savedViews}
              onApplySavedView={filters.applySavedView}
              onDeleteSavedView={handleDeleteSavedView}
              onSaveCurrentView={handleSaveCurrentView}
              onSaveSmartFolder={handleSaveSmartFolder}
            />
          )}

          {error && <div className="error-banner"><span>!</span><p><strong>Nu am putut încărca datele</strong>{error}</p><button onClick={() => void load()}>Reîncearcă</button></div>}
          {loading ? <TableSkeleton rows={8} /> : filtered.length === 0 ? <div className="empty-state"><Icon name="search"/><h3>Niciun rezultat</h3><p>Încearcă alt termen de căutare sau schimbă filtrul.</p></div> : isMobile ? (
            // Pe telefon tabelul (nouă coloane, >1000px lățime minimă) devine
            // derulare orizontală; aceleași anunțuri se arată ca listă de carduri.
            <div className="listing-card-list">
              {filtered.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  isSelected={selectedRowIds.has(listing.id)}
                  isStarred={starredIds.has(listing.id)}
                  onOpen={openDetails}
                  onToggleSelect={toggleSelectRow}
                  onToggleStar={handleToggleStar}
                  onStatusChange={(id, status) => void handleStatusChange(id, status)}
                />
              ))}
            </div>
          ) : (
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
                    return (
                      <ListingRow
                        key={listing.id}
                        listing={listing}
                        isFocused={actualIndex === focusedRowIndex}
                        isSelected={selectedRowIds.has(listing.id)}
                        isStarred={starredIds.has(listing.id)}
                        onOpen={(item) => {
                          setFocusedRowIndex(actualIndex);
                          openDetails(item);
                        }}
                        onContextMenu={(e, item) => {
                          setFocusedRowIndex(actualIndex);
                          setContextMenu({ x: e.clientX, y: e.clientY, listing: item });
                        }}
                        onToggleSelect={toggleSelectRow}
                        onToggleStar={handleToggleStar}
                        onStatusChange={(id, status) => void handleStatusChange(id, status)}
                      />
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
          <BulkActionsBar
            selectedCount={selectedRowIds.size}
            updatingBulk={updatingBulk}
            isOnline={isOnline}
            canCompare={selectedRowIds.size >= 2 && selectedRowIds.size <= 3}
            onBulkStatusChange={(status) => void handleBulkStatusChange(status)}
            onBulkDelete={() => void handleDeleteListings(Array.from(selectedRowIds))}
            onCompare={() => setShowComparison(true)}
            onPrintPdf={() => {
              const selectedListings = listings.filter((l) => selectedRowIds.has(l.id));
              printListingsPdf(selectedListings);
            }}
            onDeselect={() => setSelectedRowIds(new Set())}
          />
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

      {selected && (
        <ListingDetailDrawer
          listing={selected}
          notes={notes}
          onNotesChange={setNotes}
          loadingDetails={loadingDetails}
          loadingLogs={loadingLogs}
          activityLogs={activityLogs}
          savingNotes={savingNotes}
          notesSaved={notesSaved}
          isOnline={isOnline}
          isStarred={starredIds.has(selected.id)}
          exportingClavium={exportingClavium}
          exportSuccess={exportSuccess}
          onClose={() => setSelected(null)}
          onToggleStar={handleToggleStar}
          onStatusChange={(id, status) => void handleStatusChange(id, status)}
          onSaveNotes={() => void saveNotes()}
          onClaviumExport={(listing) => void handleClaviumExport(listing)}
          onUpdateTags={handleUpdateTags}
        />
      )}
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
          onToggleStar={(id) => handleToggleStar(id, { stopPropagation: () => {} } as unknown as React.MouseEvent)}
          onStatusChange={(id, status) => void handleStatusChange(id, status)}
          onOpenExternal={(url) => void openExternalUrl(url)}
          onDelete={(id) => void handleDeleteListings([id])}
        />
      )}
      {showPalette && (
        <CommandPaletteModal
          onClose={() => setShowPalette(false)}
          listings={listings}
          onSelectListing={openDetails}
          onNavigateView={(v) => setActiveView(v)}
          onOpenSettings={() => setShowSettings(true)}
          onToggleTheme={toggleTheme}
        />
      )}
      {showExportModal && (
        <ExportModal listings={filtered} onClose={() => setShowExportModal(false)} />
      )}
      {isMobile && (
        <MobileNav
          activeView={activeView}
          showFavoritesOnly={filters.showFavoritesOnly}
          starredCount={starredIds.size}
          newCount={counts.new}
          onNavigate={(view, favoritesOnly) => {
            setActiveView(view);
            filters.setShowFavoritesOnly(favoritesOnly);
          }}
        />
      )}
      {showChangelog && (
        <ChangelogModal
          currentVersion={APP_VERSION}
          onClose={() => {
            localStorage.setItem(LAST_SEEN_VERSION_KEY, APP_VERSION);
            setShowChangelog(false);
          }}
        />
      )}
    </div>
  );
}

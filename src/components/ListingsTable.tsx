import { useEffect, useMemo, useState } from "react";
import { signOut } from "../services/auth";
import { fetchListingsPaginated, fetchListingDetails, fetchActivityLogs, updateListingNotes, updateListingStatus, subscribeToListings, bulkUpdateListingStatus } from "../services/listings";
import type { Listing, ListingStatus, SellerType, ActivityLog } from "../types";
import logoUrl from "../../favicon.png";
import { VisualAnalytics } from "./VisualAnalytics";
import UserManagement from "./UserManagement";
import { APP_VERSION } from "../version";
import olxLogo from "../assets/olx-logo.png";
import storiaLogo from "../assets/storia-logo.svg";
import imobiliareLogo from "../assets/imobiliare-logo.svg";
import { openUrl } from "@tauri-apps/plugin-opener";

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
  const [activeView, setActiveView] = useState<"listings" | "analytics">("listings");
  
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

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [hideDuplicates, setHideDuplicates] = useState(true);
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [minSqm, setMinSqm] = useState<number | "">("");
  const [maxSqm, setMaxSqm] = useState<number | "">("");
  const [dateRange, setDateRange] = useState<"all" | "24h" | "3d" | "7d">("all");
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<"all" | "sale" | "rent">("all");

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
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

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
        setListings((current) => [newListing, ...current.filter((i) => i.id !== newListing.id)]);
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

  async function load(background = false) {
    background ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const res = await fetchListingsPaginated(1, pageSize);
      setListings(res.data);
      setPage(1);
      setTotalCount(res.totalCount);
      setHasMore(res.hasMore);
      localStorage.setItem("vatrio_cached_listings", JSON.stringify(res.data));
    } catch (e) {
      const cached = localStorage.getItem("vatrio_cached_listings");
      if (cached) {
        const parsed = JSON.parse(cached) as Listing[];
        setListings(parsed);
        setTotalCount(parsed.length);
        setHasMore(false);
        setError("Eroare de conexiune. Se afișează anunțurile salvate local.");
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
      const res = await fetchListingsPaginated(nextPage, pageSize);
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

  useEffect(() => { void load(); }, []);


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

  const counts = useMemo(() => {
    const subset = listings.filter((item) => {
      if (transactionTypeFilter !== "all" && item.transaction_type !== transactionTypeFilter) return false;
      return true;
    });
    return {
      all: subset.length,
      new: subset.filter((item) => item.status === "new").length,
      contacted: subset.filter((item) => item.status === "contacted").length,
      refused: subset.filter((item) => item.status === "refused").length,
      closed: subset.filter((item) => item.status === "closed").length,
    };
  }, [listings, transactionTypeFilter]);

  const filtered = useMemo(() => listings.filter((listing) => {
    if (hideDuplicates && listing.duplicate_of_id) return false;
    if (statusFilter !== "all" && listing.status !== statusFilter) return false;
    if (sellerFilter !== "all" && listing.seller_type !== sellerFilter) return false;
    if (transactionTypeFilter !== "all" && listing.transaction_type !== transactionTypeFilter) return false;

    // Price range filters
    if (minPrice !== "" && listing.price !== null && listing.price < minPrice) return false;
    if (maxPrice !== "" && listing.price !== null && listing.price > maxPrice) return false;

    // Surface area filters
    if (minSqm !== "" && listing.surface_sqm !== null && listing.surface_sqm < minSqm) return false;
    if (maxSqm !== "" && listing.surface_sqm !== null && listing.surface_sqm > maxSqm) return false;

    // Date scraped range filter
    if (dateRange !== "all") {
      const dateScraped = new Date(listing.date_scraped).getTime();
      const now = new Date().getTime();
      const diffMs = now - dateScraped;
      const oneDayMs = 24 * 60 * 60 * 1000;
      if (dateRange === "24h" && diffMs > oneDayMs) return false;
      if (dateRange === "3d" && diffMs > 3 * oneDayMs) return false;
      if (dateRange === "7d" && diffMs > 7 * oneDayMs) return false;
    }

    const query = debouncedSearch.trim().toLocaleLowerCase("ro");
    if (!query) return true;
    return [listing.title, listing.location, listing.source, listing.property_type]
      .some((value) => value?.toLocaleLowerCase("ro").includes(query));
  }), [listings, debouncedSearch, sellerFilter, statusFilter, minPrice, maxPrice, minSqm, maxSqm, dateRange, transactionTypeFilter, hideDuplicates]);

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
    setListings((current) =>
      current.map((item) => (selectedRowIds.has(item.id) ? { ...item, status: targetStatus } : item))
    );
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

  async function handleStatusChange(id: string, status: ListingStatus) {
    if (!isOnline) {
      setError("Nu poți modifica statusul anunțului cât timp ești offline.");
      return;
    }
    const previous = listings;
    const oldStatus = selected?.id === id ? selected.status : listings.find((item) => item.id === id)?.status;
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
        ) : (
          <>
            <header className="page-header">
              <div><p className="eyebrow">SPAȚIU DE LUCRU</p><h1>Panou anunțuri</h1><p>Urmărește și gestionează oportunitățile imobiliare.</p></div>
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

        <section className="list-panel">
          <div className="panel-toolbar">
            <div><h2>Anunțuri recente</h2><p>Se afișează {filtered.length} din {totalCount || listings.length} anunțuri</p></div>
            <div className="toolbar-actions">
              <label className="search-box"><Icon name="search"/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Caută titlu, zonă sau sursă..."/></label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}>{filters.map((filter) => <option key={filter.value} value={filter.value}>{filter.label}</option>)}</select>
              <select value={sellerFilter} onChange={(e) => setSellerFilter(e.target.value as SellerType | "all")}><option value="all">Toți vânzătorii</option><option value="owner">Proprietari</option><option value="agency">Agenții</option><option value="developer">Dezvoltatori</option><option value="unknown">Necunoscut</option></select>
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
                  setMinPrice("");
                  setMaxPrice("");
                  setMinSqm("");
                  setMaxSqm("");
                  setDateRange("all");
                }}
                style={{
                  height: "30px",
                  padding: "0 12px",
                  marginLeft: "auto",
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
          {loading ? <div className="loading-state"><div className="spinner"/><p>Se încarcă anunțurile...</p></div> : filtered.length === 0 ? <div className="empty-state"><Icon name="search"/><h3>Niciun rezultat</h3><p>Încearcă alt termen de căutare sau schimbă filtrul.</p></div> : (
            <div className="table-wrap"><table><thead><tr><th style={{ width: "36px", textAlign: "center" }}><input type="checkbox" checked={allFilteredSelected} onChange={toggleSelectAll} style={{ cursor: "pointer", width: "15px", height: "15px" }} aria-label="Selectează toate"/></th><th>PROPRIETATE</th><th>PREȚ</th><th>LOCAȚIE</th><th>SURSĂ</th><th>VÂNZĂTOR</th><th>ADĂUGAT</th><th>STATUS</th><th/></tr></thead><tbody>{filtered.map((listing) => (
              <tr key={listing.id} onClick={() => openDetails(listing)} style={{ background: selectedRowIds.has(listing.id) ? "var(--sidebar-nav-active-bg, rgba(26, 115, 232, 0.08))" : undefined }}>
                <td onClick={(e) => e.stopPropagation()} style={{ textAlign: "center" }}><input type="checkbox" checked={selectedRowIds.has(listing.id)} onChange={(e) => toggleSelectRow(listing.id, e)} style={{ cursor: "pointer", width: "15px", height: "15px" }} aria-label="Selectează anunț"/></td>
                <td><div className="property-cell">{listing.image_url ? <img src={listing.image_url} alt=""/> : <div className="image-placeholder">V</div>}<div><strong>{listing.title}{listing.duplicate_of_id && <span className="seller-badge" style={{ background: "#fff3bf", color: "#d9480f", fontWeight: 700, fontSize: "10px", marginLeft: "6px" }} title="Acest anunț este identificat ca fiind duplicat">🔗 Duplicat</span>}</strong><span>{listing.transaction_type === "sale" ? "De vânzare" : "De închiriat"} · {listing.property_type ?? "Apartament"}{listing.surface_sqm ? ` · ${listing.surface_sqm} m²` : ""}</span></div></div></td>
                <td className="price-cell">{formatPrice(listing)}</td>
                <td><span className="location-cell"><Icon name="pin"/>{listing.location ?? "Nespecificată"}</span></td>
                <td><SourceMark source={listing.source}/></td>
                <td><span className={`seller-badge ${listing.seller_type}`}>{listing.seller_type === "owner" ? "Proprietar" : listing.seller_type === "agency" ? "Agenție" : listing.seller_type === "developer" ? "Dezvoltator" : "Necunoscut"}</span></td>
                <td className="date-cell">{formatDate(listing.date_scraped)}</td>
                <td onClick={(e) => e.stopPropagation()}><label className={`status-select ${listing.status}`}><span>{STATUS_ICONS[listing.status]}</span><select value={listing.status} onChange={(e) => void handleStatusChange(listing.id, e.target.value as ListingStatus)}>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></td>
                <td><button className="external-link" onClick={(e) => { e.stopPropagation(); void openExternalUrl(listing.listing_url); }} aria-label="Deschide anunțul"><Icon name="external"/></button></td>
              </tr>
            ))}</tbody></table></div>
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
          </>
        )}
      </main>

      {selected && <><button className="drawer-backdrop" aria-label="Închide" onClick={() => setSelected(null)}/><aside className="detail-drawer">
        <button className="drawer-close" onClick={() => setSelected(null)}><Icon name="close"/></button>
        {selected.image_url && <img className="drawer-image" src={selected.image_url} alt=""/>}
        <div className="drawer-badges"><SourceMark source={selected.source}/><span className={`seller-badge ${selected.seller_type}`}>{selected.seller_type === "owner" ? "Proprietar" : selected.seller_type === "agency" ? "Agenție" : selected.seller_type === "developer" ? "Dezvoltator" : "Necunoscut"}</span><span className="seller-badge" style={{ background: selected.transaction_type === "sale" ? "#e8f0fe" : "#f3e8ff", color: selected.transaction_type === "sale" ? "#1a73e8" : "#7c3aed", fontWeight: 800 }}>{selected.transaction_type === "sale" ? "De Vânzare" : "De Închiriat"}</span></div><h2>{selected.title}</h2><p className="drawer-price">{formatPrice(selected)}</p><p className="drawer-location"><Icon name="pin"/>{selected.location ?? "Nespecificată"}</p>
        <div className="drawer-divider"/><label className="field-label">Status</label><label className={`status-select large ${selected.status}`}><span>{STATUS_ICONS[selected.status]}</span><select value={selected.status} onChange={(e) => void handleStatusChange(selected.id, e.target.value as ListingStatus)}>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="field-label notes-label">Notițe interne {loadingDetails && <span style={{ fontSize: "11px", fontWeight: 400, color: "var(--text-muted)", marginLeft: "8px" }}>(Se încarcă...)</span>}</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={loadingDetails ? "Se încarcă notițele..." : "Adaugă observații despre această proprietate..."} rows={6} disabled={loadingDetails}/>
        <button className="primary-button" onClick={() => void saveNotes()} disabled={savingNotes || !isOnline}>{savingNotes ? "Se salvează..." : notesSaved ? "✓ Notițe salvate!" : "Salvează notițele"}</button>
        <button className="secondary-button" onClick={() => void openExternalUrl(selected.listing_url)}>Vezi anunțul original <Icon name="external"/></button>
        <button className="secondary-button" style={{ marginTop: "8px", borderColor: exportSuccess ? "#2b8a3e" : "#dce2e7", color: exportSuccess ? "#2b8a3e" : "#44515d" }} onClick={() => void handleClaviumExport(selected)} disabled={exportingClavium || !isOnline}>
          {exportingClavium ? "Se trimite..." : exportSuccess ? "✓ Trimis la Clavium!" : "Trimite la Clavium"} <Icon name="external"/>
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
    </div>
  );
}

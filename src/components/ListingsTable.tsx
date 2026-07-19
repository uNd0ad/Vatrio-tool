import { useEffect, useMemo, useState } from "react";
import { signOut } from "../services/auth";
import { fetchListings, updateListingNotes, updateListingStatus } from "../services/listings";
import type { Listing, ListingStatus, SellerType } from "../types";
import logoUrl from "../../favicon.png";
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
  return <span className={`source-badge ${source}`}>{source}</span>;
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
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [exportingClavium, setExportingClavium] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
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

  async function load(background = false) {
    background ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const data = await fetchListings();
      setListings(data);
      localStorage.setItem("vatrio_cached_listings", JSON.stringify(data));
    } catch (e) {
      const cached = localStorage.getItem("vatrio_cached_listings");
      if (cached) {
        setListings(JSON.parse(cached) as Listing[]);
        setError("Eroare de conexiune. Se afișează anunțurile salvate local.");
      } else {
        setError(e instanceof Error ? e.message : "Eroare la încărcare");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
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
  }), [listings, debouncedSearch, sellerFilter, statusFilter, minPrice, maxPrice, minSqm, maxSqm, dateRange, transactionTypeFilter]);

  async function handleStatusChange(id: string, status: ListingStatus) {
    if (!isOnline) {
      setError("Nu poți modifica statusul anunțului cât timp ești offline.");
      return;
    }
    const previous = listings;
    setListings((current) => current.map((item) => item.id === id ? { ...item, status } : item));
    setSelected((current) => current?.id === id ? { ...current, status } : current);
    try {
      await updateListingStatus(id, status);
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
      await updateListingNotes(selected.id, notes);
      setListings((current) => current.map((item) => item.id === selected.id ? { ...item, notes } : item));
      setSelected({ ...selected, notes });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 3000);
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
          <button className="nav-item active"><Icon name="grid"/>Panou general</button>
          <button className="nav-item"><Icon name="list"/>Toate anunțurile</button>
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
                  padding: "6px 16px",
                  borderRadius: "6px",
                  border: 0,
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  background: active ? "var(--sidebar-nav-active)" : "transparent",
                  color: active ? "white" : "var(--text-secondary)",
                  transition: "all 0.15s"
                }}
              >
                {labels[type]}
              </button>
            );
          })}
        </div>

        <section className="list-panel">
          <div className="panel-toolbar">
            <div><h2>Anunțuri recente</h2><p>{filtered.length} din {listings.length} rezultate</p></div>
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
            <div className="table-wrap"><table><thead><tr><th>PROPRIETATE</th><th>PREȚ</th><th>LOCAȚIE</th><th>SURSĂ</th><th>VÂNZĂTOR</th><th>ADĂUGAT</th><th>STATUS</th><th/></tr></thead><tbody>{filtered.map((listing) => (
              <tr key={listing.id} onClick={() => openDetails(listing)}>
                <td><div className="property-cell">{listing.image_url ? <img src={listing.image_url} alt=""/> : <div className="image-placeholder">V</div>}<div><strong>{listing.title}</strong><span>{listing.transaction_type === "sale" ? "De vânzare" : "De închiriat"} · {listing.property_type ?? "Apartament"}{listing.surface_sqm ? ` · ${listing.surface_sqm} m²` : ""}</span></div></div></td>
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
        </section>
      </main>

      {selected && <><button className="drawer-backdrop" aria-label="Închide" onClick={() => setSelected(null)}/><aside className="detail-drawer">
        <button className="drawer-close" onClick={() => setSelected(null)}><Icon name="close"/></button>
        {selected.image_url && <img className="drawer-image" src={selected.image_url} alt=""/>}
        <div className="drawer-badges"><SourceMark source={selected.source}/><span className={`seller-badge ${selected.seller_type}`}>{selected.seller_type === "owner" ? "Proprietar" : selected.seller_type === "agency" ? "Agenție" : selected.seller_type === "developer" ? "Dezvoltator" : "Necunoscut"}</span><span className="seller-badge" style={{ background: selected.transaction_type === "sale" ? "#e8f0fe" : "#f3e8ff", color: selected.transaction_type === "sale" ? "#1a73e8" : "#7c3aed", fontWeight: 800 }}>{selected.transaction_type === "sale" ? "De Vânzare" : "De Închiriat"}</span></div><h2>{selected.title}</h2><p className="drawer-price">{formatPrice(selected)}</p><p className="drawer-location"><Icon name="pin"/>{selected.location ?? "Nespecificată"}</p>
        <div className="drawer-divider"/><label className="field-label">Status</label><label className={`status-select large ${selected.status}`}><span>{STATUS_ICONS[selected.status]}</span><select value={selected.status} onChange={(e) => void handleStatusChange(selected.id, e.target.value as ListingStatus)}>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="field-label notes-label">Notițe interne</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Adaugă observații despre această proprietate..." rows={6}/>
        <button className="primary-button" onClick={() => void saveNotes()} disabled={savingNotes || !isOnline}>{savingNotes ? "Se salvează..." : notesSaved ? "✓ Notițe salvate!" : "Salvează notițele"}</button>
        <button className="secondary-button" onClick={() => void openExternalUrl(selected.listing_url)}>Vezi anunțul original <Icon name="external"/></button>
        <button className="secondary-button" style={{ marginTop: "8px", borderColor: exportSuccess ? "#2b8a3e" : "#dce2e7", color: exportSuccess ? "#2b8a3e" : "#44515d" }} onClick={() => void handleClaviumExport(selected)} disabled={exportingClavium || !isOnline}>
          {exportingClavium ? "Se trimite..." : exportSuccess ? "✓ Trimis la Clavium!" : "Trimite la Clavium"} <Icon name="external"/>
        </button>
      </aside></>}      {showUsers && <UserManagement onClose={() => setShowUsers(false)}/>} 
    </div>
  );
}

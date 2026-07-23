import logoUrl from "../../favicon.png";
import { signOut } from "../services/auth";
import { APP_VERSION } from "../version";
import type { StatusCounts } from "../services/listings";
import type { SavedFilter } from "../utils/savedFilters";
import type { Theme } from "../utils/theme";
import type { StatusFilter } from "../utils/listingDisplay";
import type { ListingStatus } from "../types";
import { Icon } from "./Icon";

export type ActiveView = "listings" | "board" | "map" | "analytics" | "trash";

const STATUS_FILTER_ITEMS: Array<{ value: ListingStatus; label: string }> = [
  { value: "new", label: "Noi" },
  { value: "contacted", label: "Contactate" },
  { value: "refused", label: "Refuzate" },
  { value: "closed", label: "Închise" },
];

interface SidebarProps {
  userEmail: string;
  isMaster: boolean;
  activeView: ActiveView;
  showFavoritesOnly: boolean;
  starredCount: number;
  statusFilter: StatusFilter;
  counts: StatusCounts;
  savedFilters: SavedFilter[];
  theme: Theme;
  onNavigate: (view: ActiveView, favoritesOnly: boolean) => void;
  onShowUsers: () => void;
  onStatusFilter: (status: StatusFilter) => void;
  onApplySavedFilter: (filter: SavedFilter) => void;
  onDeleteSavedFilter: (id: string) => void;
  onToggleTheme: () => void;
  onShowSettings: () => void;
}

export function Sidebar({
  userEmail,
  isMaster,
  activeView,
  showFavoritesOnly,
  starredCount,
  statusFilter,
  counts,
  savedFilters,
  theme,
  onNavigate,
  onShowUsers,
  onStatusFilter,
  onApplySavedFilter,
  onDeleteSavedFilter,
  onToggleTheme,
  onShowSettings,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand"><img src={logoUrl} alt=""/><div><strong>Vatrio</strong><span>Property CRM</span></div></div>
      <nav>
        <button className={`nav-item ${activeView === "listings" && !showFavoritesOnly ? "active" : ""}`} onClick={() => onNavigate("listings", false)}><Icon name="grid"/>Panou general</button>
        <button className={`nav-item ${activeView === "listings" && showFavoritesOnly ? "active" : ""}`} onClick={() => onNavigate("listings", true)}><span style={{ marginRight: "6px" }}>★</span>Favorite ({starredCount})</button>
        <button className={`nav-item ${activeView === "board" ? "active" : ""}`} onClick={() => onNavigate("board", false)}><Icon name="list"/>Panou Kanban</button>
        <button className={`nav-item ${activeView === "map" ? "active" : ""}`} onClick={() => onNavigate("map", false)}><Icon name="pin"/>Hartă</button>
        <button className={`nav-item ${activeView === "analytics" ? "active" : ""}`} onClick={() => onNavigate("analytics", false)}><Icon name="list"/>Analiză vizuală</button>
        <button className={`nav-item ${activeView === "trash" ? "active" : ""}`} onClick={() => onNavigate("trash", false)}><span style={{ marginRight: "6px" }}>🗑</span>Șterse</button>
        {isMaster && <button className="nav-item" onClick={onShowUsers}><Icon name="grid"/>Utilizatori</button>}
      </nav>
      <div className="sidebar-section">
        <p>Status anunțuri</p>
        {STATUS_FILTER_ITEMS.map((filter) => (
          <button key={filter.value} className={`filter-link ${statusFilter === filter.value ? "selected" : ""}`} onClick={() => onStatusFilter(filter.value)}>
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
                onClick={() => onApplySavedFilter(sf)}
              >
                📁 {sf.name}
              </button>
              <button
                onClick={() => onDeleteSavedFilter(sf.id)}
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
            onClick={onToggleTheme}
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
            onClick={onShowSettings}
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
  );
}

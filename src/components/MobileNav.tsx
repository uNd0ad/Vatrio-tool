import type { ActiveView } from "./Sidebar";
import { Icon, type IconName } from "./Icon";

interface MobileNavProps {
  activeView: ActiveView;
  showFavoritesOnly: boolean;
  starredCount: number;
  newCount: number;
  onNavigate: (view: ActiveView, favoritesOnly: boolean) => void;
}

const ITEMS: Array<{ view: ActiveView; favorites?: boolean; icon: IconName; label: string }> = [
  { view: "listings", icon: "grid", label: "Anunțuri" },
  { view: "listings", favorites: true, icon: "grid", label: "Favorite" },
  { view: "board", icon: "list", label: "Kanban" },
  { view: "map", icon: "pin", label: "Hartă" },
  { view: "analytics", icon: "list", label: "Analiză" },
];

/** Bara de navigare de jos — înlocuiește sidebar-ul fix pe ecrane de telefon. */
export function MobileNav({ activeView, showFavoritesOnly, starredCount, newCount, onNavigate }: MobileNavProps) {
  return (
    <nav className="mobile-nav" aria-label="Navigare principală">
      {ITEMS.map((item) => {
        const favorites = item.favorites ?? false;
        const active = activeView === item.view && (item.view !== "listings" || showFavoritesOnly === favorites);
        const badge = favorites ? starredCount : item.view === "listings" ? newCount : 0;
        return (
          <button
            key={`${item.view}-${item.label}`}
            className={active ? "active" : ""}
            onClick={() => onNavigate(item.view, favorites)}
            aria-current={active ? "page" : undefined}
          >
            {favorites ? <span className="mobile-nav-glyph">★</span> : <Icon name={item.icon} />}
            <span className="mobile-nav-label">{item.label}</span>
            {badge > 0 && <span className="mobile-nav-badge">{badge > 99 ? "99+" : badge}</span>}
          </button>
        );
      })}
    </nav>
  );
}

import type { ListingFiltersState } from "../hooks/useListingFilters";
import type { SavedViewFilter } from "../utils/savedViews";
import { NEIGHBORHOODS } from "../utils/neighborhoods";

interface AdvancedFiltersPanelProps {
  filters: ListingFiltersState;
  savedViews: SavedViewFilter[];
  onApplySavedView: (view: SavedViewFilter) => void;
  onDeleteSavedView: (id: string, e: React.MouseEvent) => void;
  onSaveCurrentView: () => void;
  onSaveSmartFolder: () => void;
}

const numberInputStyle = (width: string): React.CSSProperties => ({
  width,
  height: "30px",
  padding: "0 8px",
  border: "1px solid var(--button-border)",
  borderRadius: "6px",
  fontSize: "11px",
  background: "var(--input-bg)",
  color: "var(--input-color)",
});

const selectStyle: React.CSSProperties = {
  height: "30px",
  padding: "0 8px",
  border: "1px solid var(--button-border)",
  borderRadius: "6px",
  fontSize: "11px",
  background: "var(--button-bg)",
  color: "var(--button-color)",
};

export function AdvancedFiltersPanel({
  filters,
  savedViews,
  onApplySavedView,
  onDeleteSavedView,
  onSaveCurrentView,
  onSaveSmartFolder,
}: AdvancedFiltersPanelProps) {
  return (
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
            <button onClick={() => onApplySavedView(view)} style={{ background: "transparent", border: 0, color: "var(--button-color)", cursor: "pointer", fontWeight: 600, fontSize: "11px", padding: 0 }}>{view.name}</button>
            <button onClick={(e) => onDeleteSavedView(view.id, e)} title="Șterge vizualizarea" aria-label="Șterge vizualizarea" style={{ background: "transparent", border: 0, color: "var(--text-muted)", cursor: "pointer", lineHeight: 1, fontSize: "13px", padding: "0 4px" }}>×</button>
          </span>
        ))}
        <button onClick={onSaveCurrentView} style={{ background: "transparent", border: "1px dashed var(--button-border)", borderRadius: "14px", padding: "3px 12px", fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", cursor: "pointer" }}>+ Salvează filtrele curente</button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)" }}>CARTIER:</span>
        <select
          value={filters.neighborhoodFilter}
          onChange={(e) => filters.setNeighborhoodFilter(e.target.value)}
          style={selectStyle}
          aria-label="Filtrează după cartier"
        >
          <option value="all">Toate cartierele</option>
          {NEIGHBORHOODS.map((neighborhood) => (
            <option key={neighborhood} value={neighborhood}>{neighborhood}</option>
          ))}
          {/* Anunțurile pe care parserul nu le-a putut încadra rămân
              accesibile: de obicei acolo se văd zonele lipsă din listă. */}
          <option value="unknown">Neîncadrate</option>
        </select>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)" }}>PREȚ (€):</span>
        <input
          type="number"
          value={filters.minPrice}
          onChange={(e) => filters.setMinPrice(e.target.value ? parseInt(e.target.value, 10) : "")}
          placeholder="Min"
          style={numberInputStyle("80px")}
        />
        <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>-</span>
        <input
          type="number"
          value={filters.maxPrice}
          onChange={(e) => filters.setMaxPrice(e.target.value ? parseInt(e.target.value, 10) : "")}
          placeholder="Max"
          style={numberInputStyle("80px")}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)" }}>SUPRAFAȚĂ (m²):</span>
        <input
          type="number"
          value={filters.minSqm}
          onChange={(e) => filters.setMinSqm(e.target.value ? parseInt(e.target.value, 10) : "")}
          placeholder="Min"
          style={numberInputStyle("70px")}
        />
        <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>-</span>
        <input
          type="number"
          value={filters.maxSqm}
          onChange={(e) => filters.setMaxSqm(e.target.value ? parseInt(e.target.value, 10) : "")}
          placeholder="Max"
          style={numberInputStyle("70px")}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)" }}>PERIOADA:</span>
        <select
          value={filters.dateRange}
          onChange={(e) => filters.setDateRange(e.target.value as typeof filters.dateRange)}
          style={selectStyle}
        >
          <option value="all">Toate perioadele</option>
          <option value="24h">Ultimele 24 de ore</option>
          <option value="3d">Ultimele 3 zile</option>
          <option value="7d">Ultimele 7 zile</option>
        </select>
      </div>

      <button
        onClick={onSaveSmartFolder}
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
        onClick={filters.resetRangeFilters}
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
  );
}

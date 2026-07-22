import type { ActivityLog, Listing, ListingStatus } from "../types";
import { formatDate, formatPrice } from "../utils/format";
import { formatPricePerSqm } from "../utils/pricePerSqm";
import { calculateDaysOnMarket } from "../utils/daysOnMarket";
import { openExternalUrl } from "../utils/externalUrl";
import { openDetachedListingWindow } from "../utils/windowManager";
import { STATUS_ICONS, STATUS_LABELS, sellerTypeLabel } from "../utils/listingDisplay";
import { Icon } from "./Icon";
import { SourceMark } from "./SourceMark";
import { ImageGallery } from "./ImageGallery";
import { PriceHistoryTimeline } from "./PriceHistoryTimeline";
import { TagManager } from "./TagManager";

interface ListingDetailDrawerProps {
  listing: Listing;
  notes: string;
  onNotesChange: (value: string) => void;
  loadingDetails: boolean;
  loadingLogs: boolean;
  activityLogs: ActivityLog[];
  savingNotes: boolean;
  notesSaved: boolean;
  isOnline: boolean;
  isStarred: boolean;
  exportingClavium: boolean;
  exportSuccess: boolean;
  onClose: () => void;
  onToggleStar: (id: string, e: React.MouseEvent) => void;
  onStatusChange: (id: string, status: ListingStatus) => void;
  onSaveNotes: () => void;
  onClaviumExport: (listing: Listing) => void;
  onUpdateTags: (tags: string[]) => void;
}

export function ListingDetailDrawer({
  listing,
  notes,
  onNotesChange,
  loadingDetails,
  loadingLogs,
  activityLogs,
  savingNotes,
  notesSaved,
  isOnline,
  isStarred,
  exportingClavium,
  exportSuccess,
  onClose,
  onToggleStar,
  onStatusChange,
  onSaveNotes,
  onClaviumExport,
  onUpdateTags,
}: ListingDetailDrawerProps) {
  return (
    <>
      <button className="drawer-backdrop" aria-label="Închide" onClick={onClose}/>
      <aside className="detail-drawer">
        <button className="drawer-close" onClick={onClose}><Icon name="close"/></button>
        <ImageGallery primaryImageUrl={listing.image_url} images={listing.images} altText={listing.title} />
        <div className="drawer-badges"><SourceMark source={listing.source}/><span className={`seller-badge ${listing.seller_type}`}>{sellerTypeLabel(listing.seller_type)}</span><span className="seller-badge" style={{ background: listing.transaction_type === "sale" ? "#e8f0fe" : "#f3e8ff", color: listing.transaction_type === "sale" ? "#1a73e8" : "#7c3aed", fontWeight: 800 }}>{listing.transaction_type === "sale" ? "De Vânzare" : "De Închiriat"}</span></div><h2>{listing.title}</h2><p className="drawer-price">{formatPrice(listing)}{formatPricePerSqm(listing) && <span style={{ fontSize: "13px", fontWeight: 400, color: "var(--text-muted)", marginLeft: "10px" }}>({formatPricePerSqm(listing)})</span>}</p><p className="drawer-location"><Icon name="pin"/>{listing.location ?? "Nespecificată"}</p>
        <p className="drawer-location" style={{ fontSize: "12px", color: "var(--text-muted)" }}>{calculateDaysOnMarket(listing.date_scraped)} zile pe piață · Adăugat {formatDate(listing.date_scraped)}</p>
        <PriceHistoryTimeline currentPrice={listing.price} currentCurrency={listing.currency} history={listing.price_history} />
        <TagManager
          tags={listing.tags}
          onAddTag={(tag) => onUpdateTags([...(listing.tags || []), tag])}
          onRemoveTag={(tag) => onUpdateTags((listing.tags || []).filter((t) => t !== tag))}
        />
        <button className="secondary-button" onClick={(e) => onToggleStar(listing.id, e)} style={{ color: isStarred ? "#d9480f" : undefined, borderColor: isStarred ? "#f59f00" : undefined }}>{isStarred ? "★ Elimină din favorite" : "☆ Adaugă la favorite"}</button>
        <div className="drawer-divider"/><label className="field-label">Status</label><label className={`status-select large ${listing.status}`}><span>{STATUS_ICONS[listing.status]}</span><select value={listing.status} onChange={(e) => onStatusChange(listing.id, e.target.value as ListingStatus)}>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="field-label notes-label">Notițe interne {loadingDetails && <span style={{ fontSize: "11px", fontWeight: 400, color: "var(--text-muted)", marginLeft: "8px" }}>(Se încarcă...)</span>}</label><textarea value={notes} onChange={(e) => onNotesChange(e.target.value)} onBlur={onSaveNotes} placeholder={loadingDetails ? "Se încarcă notițele..." : "Adaugă observații despre această proprietate..."} rows={6} disabled={loadingDetails}/>
        <button className="primary-button" onClick={onSaveNotes} disabled={savingNotes || !isOnline}>{savingNotes ? "Se salvează..." : notesSaved ? "✓ Notițe salvate!" : "Salvează notițele"}</button>
        <button className="secondary-button" onClick={() => void openExternalUrl(listing.listing_url)}>Vezi anunțul original <Icon name="external"/></button>
        <button className="secondary-button" style={{ marginTop: "8px", borderColor: exportSuccess ? "#2b8a3e" : "#dce2e7", color: exportSuccess ? "#2b8a3e" : "#44515d" }} onClick={() => onClaviumExport(listing)} disabled={exportingClavium || !isOnline}>
          {exportingClavium ? "Se trimite..." : exportSuccess ? "✓ Trimis la Clavium!" : "Trimite la Clavium"} <Icon name="external"/>
        </button>
        <button className="secondary-button" style={{ marginTop: "8px" }} onClick={() => void openDetachedListingWindow(listing.id, listing.title)}>
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
      </aside>
    </>
  );
}

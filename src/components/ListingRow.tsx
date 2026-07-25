import type { Listing, ListingStatus } from "../types";
import { formatDate, formatPrice, truncateListingTitle } from "../utils/format";
import { formatPricePerSqm } from "../utils/pricePerSqm";
import { openExternalUrl } from "../utils/externalUrl";
import { STATUS_ICONS, STATUS_LABELS, listingLocationLabel, sellerTypeLabel, transactionTypeLabel } from "../utils/listingDisplay";
import { Icon } from "./Icon";
import { SourceMark } from "./SourceMark";

interface ListingRowProps {
  listing: Listing;
  isFocused: boolean;
  isSelected: boolean;
  isStarred: boolean;
  onOpen: (listing: Listing) => void;
  onContextMenu: (e: React.MouseEvent, listing: Listing) => void;
  onToggleSelect: (id: string, e: React.MouseEvent | React.ChangeEvent) => void;
  onToggleStar: (id: string, e: React.MouseEvent) => void;
  onStatusChange: (id: string, status: ListingStatus) => void;
}

export function ListingRow({
  listing,
  isFocused,
  isSelected,
  isStarred,
  onOpen,
  onContextMenu,
  onToggleSelect,
  onToggleStar,
  onStatusChange,
}: ListingRowProps) {
  return (
    <tr
      onClick={() => onOpen(listing)}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu(e, listing);
      }}
      style={{
        background: isSelected
          ? "var(--sidebar-nav-active-bg, rgba(26, 115, 232, 0.08))"
          : isFocused
          ? "rgba(59, 130, 246, 0.12)"
          : undefined,
        outline: isFocused ? "1px dashed #3b82f6" : undefined,
      }}
    >
      <td onClick={(e) => e.stopPropagation()} style={{ textAlign: "center" }}><input type="checkbox" checked={isSelected} onChange={(e) => onToggleSelect(listing.id, e)} style={{ cursor: "pointer", width: "15px", height: "15px" }} aria-label="Selectează anunț"/></td>
      <td><div className="property-cell">{listing.image_url ? <img src={listing.image_url} alt=""/> : <div className="image-placeholder">V</div>}<div><strong>{truncateListingTitle(listing.title)}{listing.duplicate_of_id && <span className="seller-badge" style={{ background: "#fff3bf", color: "#d9480f", fontWeight: 700, fontSize: "10px", marginLeft: "6px" }} title="Acest anunț este identificat ca fiind duplicat">🔗 Duplicat</span>}</strong><span>{transactionTypeLabel(listing.transaction_type)} · {listing.property_type ?? "Apartament"}{listing.surface_sqm ? ` · ${listing.surface_sqm} m²` : ""}</span></div></div></td>
      <td className="price-cell">
        <div>{formatPrice(listing)}</div>
        {formatPricePerSqm(listing) && (
          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 400, display: "block" }}>
            {formatPricePerSqm(listing)}
          </span>
        )}
      </td>
      <td><span className="location-cell" title={listing.location ?? undefined}><Icon name="pin"/>{listingLocationLabel(listing)}</span></td>
      <td><SourceMark source={listing.source}/></td>
      <td><span className={`seller-badge ${listing.seller_type}`}>{sellerTypeLabel(listing.seller_type)}</span></td>
      <td className="date-cell">{formatDate(listing.date_scraped)}</td>
      <td onClick={(e) => e.stopPropagation()}><label className={`status-select ${listing.status}`}><span>{STATUS_ICONS[listing.status]}</span><select value={listing.status} onChange={(e) => onStatusChange(listing.id, e.target.value as ListingStatus)}>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></td>
      <td onClick={(e) => e.stopPropagation()} style={{ whiteSpace: "nowrap" }}>
        <button className="external-link" onClick={(e) => onToggleStar(listing.id, e)} aria-label={isStarred ? "Elimină din favorite" : "Adaugă la favorite"} title="Favorit" style={{ color: isStarred ? "#f59f00" : undefined, fontSize: "16px" }}>{isStarred ? "★" : "☆"}</button>
        <button className="external-link" onClick={(e) => { e.stopPropagation(); void openExternalUrl(listing.listing_url); }} aria-label="Deschide anunțul"><Icon name="external"/></button>
      </td>
    </tr>
  );
}

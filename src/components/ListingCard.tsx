import type { Listing, ListingStatus } from "../types";
import { formatPrice, truncateListingTitle } from "../utils/format";
import { formatPricePerSqm } from "../utils/pricePerSqm";
import { calculateDaysOnMarket } from "../utils/daysOnMarket";
import { openExternalUrl } from "../utils/externalUrl";
import { STATUS_ICONS, STATUS_LABELS, sellerTypeLabel, transactionTypeLabel } from "../utils/listingDisplay";
import { SourceMark } from "./SourceMark";

interface ListingCardProps {
  listing: Listing;
  isSelected: boolean;
  isStarred: boolean;
  onOpen: (listing: Listing) => void;
  onToggleSelect: (id: string, e: React.MouseEvent | React.ChangeEvent) => void;
  onToggleStar: (id: string, e: React.MouseEvent) => void;
  onStatusChange: (id: string, status: ListingStatus) => void;
}

/**
 * Varianta de telefon a unui rând din tabel. Tabelul are nouă coloane și peste
 * 1000px de lățime minimă, deci pe ecran mic devine derulare orizontală.
 *
 * Acțiunea principală e „Vezi anunțul": aplicația nu stochează numere de
 * telefon (vezi README), așa că numărul se vede pe pagina sursă, în momentul în
 * care decizi să suni.
 */
export function ListingCard({
  listing,
  isSelected,
  isStarred,
  onOpen,
  onToggleSelect,
  onToggleStar,
  onStatusChange,
}: ListingCardProps) {
  const pricePerSqm = formatPricePerSqm(listing.price, listing.surface_sqm, listing.currency);

  return (
    <article className={`listing-card ${isSelected ? "selected" : ""}`}>
      <div className="listing-card-main" onClick={() => onOpen(listing)}>
        {listing.image_url
          ? <img src={listing.image_url} alt="" loading="lazy" />
          : <div className="listing-card-placeholder">V</div>}

        <div className="listing-card-body">
          <div className="listing-card-top">
            <strong>{truncateListingTitle(listing.title, 60)}</strong>
            <button
              className="listing-card-star"
              onClick={(e) => { e.stopPropagation(); onToggleStar(listing.id, e); }}
              aria-label={isStarred ? "Elimină din favorite" : "Adaugă la favorite"}
              style={{ color: isStarred ? "#f59f00" : undefined }}
            >
              {isStarred ? "★" : "☆"}
            </button>
          </div>

          <p className="listing-card-price">
            {formatPrice(listing)}
            {pricePerSqm && <span> · {pricePerSqm}</span>}
          </p>

          <p className="listing-card-meta">
            📍 {listing.location ?? "Nespecificată"}
            {listing.surface_sqm ? ` · ${listing.surface_sqm} m²` : ""}
          </p>

          <div className="listing-card-badges">
            <SourceMark source={listing.source} />
            <span className={`seller-badge ${listing.seller_type}`}>{sellerTypeLabel(listing.seller_type)}</span>
            <span className="seller-badge">{transactionTypeLabel(listing.transaction_type)}</span>
            {listing.duplicate_of_id && (
              <span className="seller-badge" style={{ background: "#fff3bf", color: "#d9480f" }}>🔗 Duplicat</span>
            )}
            <span className="listing-card-age">{calculateDaysOnMarket(listing.date_scraped)} zile</span>
          </div>
        </div>
      </div>

      <div className="listing-card-actions">
        <label className="listing-card-select">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onToggleSelect(listing.id, e)}
            aria-label="Selectează anunț"
          />
          Selectează
        </label>

        <label className={`status-select ${listing.status}`}>
          <span>{STATUS_ICONS[listing.status]}</span>
          <select
            value={listing.status}
            onChange={(e) => onStatusChange(listing.id, e.target.value as ListingStatus)}
            aria-label="Schimbă statusul"
          >
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>

        <button
          className="listing-card-open"
          onClick={() => void openExternalUrl(listing.listing_url)}
        >
          Vezi anunțul ↗
        </button>
      </div>
    </article>
  );
}

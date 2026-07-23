import { useEffect, useState } from "react";
import { fetchDeletedListings, restoreListing, type DeletedListing } from "../services/listings";
import { formatPrice, formatDate } from "../utils/format";
import { sellerTypeLabel, transactionTypeLabel } from "../utils/listingDisplay";
import { TRASH_RETENTION_DAYS, daysUntilPurge } from "../utils/purgeCountdown";
import { openExternalUrl } from "../utils/externalUrl";
import { SourceMark } from "./SourceMark";
import { Icon } from "./Icon";

interface DeletedListingsProps {
  isOnline: boolean;
  /** Anunțul restaurat reintră în listele active, deci se cere o reîncărcare. */
  onRestored: () => void;
}

export function DeletedListings({ isOnline, onRestored }: DeletedListingsProps) {
  const [items, setItems] = useState<DeletedListing[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      setItems(await fetchDeletedListings());
    } catch (e) {
      setItems([]);
      setError(e instanceof Error ? e.message : "Nu s-au putut încărca anunțurile șterse.");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleRestore(listing: DeletedListing) {
    if (!isOnline) {
      setError("Nu poți restaura anunțuri cât timp ești offline.");
      return;
    }
    setRestoringId(listing.id);
    const previous = items ?? [];
    setItems((current) => (current ?? []).filter((item) => item.id !== listing.id));
    try {
      await restoreListing(listing.id);
      onRestored();
    } catch (e) {
      setItems(previous);
      setError(e instanceof Error ? e.message : "Restaurarea a eșuat.");
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">SPAȚIU DE LUCRU</p>
          <h1>Anunțuri șterse</h1>
          <p>Se șterg definitiv la {TRASH_RETENTION_DAYS} de zile după eliminare. Până atunci pot fi restaurate.</p>
        </div>
        <button className="refresh-button" onClick={() => void load()} disabled={!isOnline}>
          <Icon name="refresh" />Reîncarcă
        </button>
      </header>

      {error && (
        <div className="error-banner"><span>!</span><p><strong>Eroare</strong>{error}</p></div>
      )}

      {items === null ? (
        <div className="loading-state"><div className="spinner" /><p>Se încarcă coșul de gunoi...</p></div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <Icon name="close" />
          <h3>Coșul de gunoi este gol</h3>
          <p>Anunțurile pe care le ștergi apar aici și pot fi restaurate {TRASH_RETENTION_DAYS} de zile.</p>
        </div>
      ) : (
        <div className="listing-card-list" style={{ padding: 0 }}>
          {items.map((listing) => {
            const remaining = daysUntilPurge(listing.deleted_at);
            const urgent = remaining <= 3;
            return (
              <article key={listing.id} className="listing-card">
                <div className="listing-card-main" style={{ cursor: "default" }}>
                  {listing.image_url
                    ? <img src={listing.image_url} alt="" loading="lazy" />
                    : <div className="listing-card-placeholder">V</div>}
                  <div className="listing-card-body">
                    <div className="listing-card-top">
                      <strong>{listing.title}</strong>
                    </div>
                    <p className="listing-card-price">{formatPrice(listing)}</p>
                    <p className="listing-card-meta">📍 {listing.location ?? "Nespecificată"}</p>
                    <div className="listing-card-badges">
                      <SourceMark source={listing.source} />
                      <span className={`seller-badge ${listing.seller_type}`}>{sellerTypeLabel(listing.seller_type)}</span>
                      <span className="seller-badge">{transactionTypeLabel(listing.transaction_type)}</span>
                      <span className="listing-card-age">Șters {formatDate(listing.deleted_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="listing-card-actions">
                  <span
                    style={{ fontSize: "12px", fontWeight: 700, color: urgent ? "#d85b5b" : "var(--text-secondary)" }}
                    title="Zile rămase până la ștergerea definitivă din baza de date."
                  >
                    {remaining === 0
                      ? "Se șterge definitiv azi"
                      : `${remaining} ${remaining === 1 ? "zi" : "zile"} până la ștergere`}
                  </span>
                  <button
                    className="listing-card-open"
                    style={{ marginLeft: "auto" }}
                    onClick={() => void handleRestore(listing)}
                    disabled={restoringId === listing.id || !isOnline}
                  >
                    {restoringId === listing.id ? "Se restaurează..." : "↩ Restaurează"}
                  </button>
                  <button
                    className="listing-card-open"
                    onClick={() => void openExternalUrl(listing.listing_url)}
                  >
                    Vezi anunțul ↗
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}

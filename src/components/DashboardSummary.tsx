import React from 'react';
import { Listing } from '../types';
import { calculatePricePerSqm } from '../utils/pricePerSqm';

// Numărătorile pe statusuri (Total/Nou/Contactat/Închis) trăiesc exclusiv în
// stats-grid-ul din ListingsTable; aici rămân doar indicatorii care nu există
// acolo, ca cele două rânduri să nu mai afișeze aceleași cifre de două ori.
interface DashboardSummaryProps {
  listings: Listing[];
  onFilterNewToday?: () => void;
}

export const DashboardSummary: React.FC<DashboardSummaryProps> = ({
  listings,
  onFilterNewToday,
}) => {
  const newTodayCount = React.useMemo(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return listings.filter((l) => new Date(l.date_scraped).getTime() >= cutoff).length;
  }, [listings]);

  // Doar vânzările: o medie peste vânzări (~100.000 €) și chirii (~500 €) nu
  // descrie nicio piață reală.
  const avgPrice = React.useMemo(() => {
    const valid = listings.filter((l) => l.transaction_type === "sale" && l.price !== null && l.price > 0);
    if (valid.length === 0) return null;
    const sum = valid.reduce((acc, l) => acc + l.price!, 0);
    return Math.round(sum / valid.length);
  }, [listings]);

  const avgPricePerSqm = React.useMemo(() => {
    const valid = listings
      .map((l) => calculatePricePerSqm(l))
      .filter((rate): rate is number => rate !== null);
    if (valid.length === 0) return null;
    const sum = valid.reduce((acc, rate) => acc + rate, 0);
    return Math.round(sum / valid.length);
  }, [listings]);

  return (
    <div
      className="dashboard-summary"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
        padding: '16px 20px',
        background: 'var(--table-header-bg, #f8fafc)',
        borderBottom: '1px solid var(--panel-toolbar-border, #e2e8f0)',
      }}
    >
      <div
        className="summary-card"
        onClick={onFilterNewToday}
        style={{
          background: 'var(--card-bg, #ffffff)',
          border: '1px solid #bfdbfe',
          borderRadius: '10px',
          padding: '12px 16px',
          cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#1d4ed8' }}>
          NOI ASTĂZI (24h)
        </span>
        <div style={{ fontSize: '20px', fontWeight: 700, color: '#1e40af', marginTop: '4px' }}>
          {newTodayCount}
        </div>
      </div>

      {avgPrice !== null && (
        <div
          className="summary-card"
          style={{
            background: 'var(--card-bg, #ffffff)',
            border: '1px solid var(--panel-toolbar-border, #e2e8f0)',
            borderRadius: '10px',
            padding: '12px 16px',
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary, #64748b)' }}>
            PREȚ MEDIU (VÂNZARE)
          </span>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main, #0f172a)', marginTop: '4px' }}>
            {new Intl.NumberFormat('ro-RO').format(avgPrice)} €
            {avgPricePerSqm && (
              <span style={{ fontSize: '11px', fontWeight: 400, color: '#64748b', display: 'block' }}>
                ({new Intl.NumberFormat('ro-RO').format(avgPricePerSqm)} €/m²)
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { Listing, ListingStatus } from '../types';
import { calculatePricePerSqm } from '../utils/pricePerSqm';

interface DashboardSummaryProps {
  listings: Listing[];
  statusCounts: {
    all: number;
    new: number;
    contacted: number;
    refused: number;
    closed: number;
  };
  onFilterStatus?: (status: ListingStatus | 'all') => void;
  onFilterNewToday?: () => void;
}

export const DashboardSummary: React.FC<DashboardSummaryProps> = ({
  listings,
  statusCounts,
  onFilterStatus,
  onFilterNewToday,
}) => {
  const newTodayCount = React.useMemo(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return listings.filter((l) => new Date(l.date_scraped).getTime() >= cutoff).length;
  }, [listings]);

  const avgPrice = React.useMemo(() => {
    const valid = listings.filter((l) => l.price !== null && l.price > 0);
    if (valid.length === 0) return null;
    const sum = valid.reduce((acc, l) => acc + l.price!, 0);
    return Math.round(sum / valid.length);
  }, [listings]);

  const avgPricePerSqm = React.useMemo(() => {
    const valid = listings
      .map((l) => calculatePricePerSqm(l.price, l.surface_sqm))
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
        onClick={() => onFilterStatus?.('all')}
        style={{
          background: 'var(--card-bg, #ffffff)',
          border: '1px solid var(--panel-toolbar-border, #e2e8f0)',
          borderRadius: '10px',
          padding: '12px 16px',
          cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary, #64748b)' }}>
          TOTAL ANUNȚURI
        </span>
        <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-main, #0f172a)', marginTop: '4px' }}>
          {statusCounts.all || listings.length}
        </div>
      </div>

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

      <div
        className="summary-card"
        onClick={() => onFilterStatus?.('new')}
        style={{
          background: 'var(--card-bg, #ffffff)',
          border: '1px solid var(--panel-toolbar-border, #e2e8f0)',
          borderRadius: '10px',
          padding: '12px 16px',
          cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#2563eb' }}>
          ● STATUS NOU
        </span>
        <div style={{ fontSize: '20px', fontWeight: 700, color: '#1d4ed8', marginTop: '4px' }}>
          {statusCounts.new}
        </div>
      </div>

      <div
        className="summary-card"
        onClick={() => onFilterStatus?.('contacted')}
        style={{
          background: 'var(--card-bg, #ffffff)',
          border: '1px solid var(--panel-toolbar-border, #e2e8f0)',
          borderRadius: '10px',
          padding: '12px 16px',
          cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#d97706' }}>
          ◐ CONTACTAT
        </span>
        <div style={{ fontSize: '20px', fontWeight: 700, color: '#b45309', marginTop: '4px' }}>
          {statusCounts.contacted}
        </div>
      </div>

      <div
        className="summary-card"
        onClick={() => onFilterStatus?.('closed')}
        style={{
          background: 'var(--card-bg, #ffffff)',
          border: '1px solid var(--panel-toolbar-border, #e2e8f0)',
          borderRadius: '10px',
          padding: '12px 16px',
          cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#059669' }}>
          ✓ ÎNCHIS / TRANZACȚIONAT
        </span>
        <div style={{ fontSize: '20px', fontWeight: 700, color: '#047857', marginTop: '4px' }}>
          {statusCounts.closed}
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
            PREȚ MEDIU
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

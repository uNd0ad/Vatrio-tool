import React from 'react';
import { Listing } from '../types';
import { downloadCsvReport, downloadJsonReport } from '../utils/exportListings';
import { printListingsPdf } from '../utils/printListings';

interface ExportModalProps {
  listings: Listing[];
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ listings, onClose }) => {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 3000,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--card-bg, #ffffff)',
          border: '1px solid var(--panel-toolbar-border, #dce2e7)',
          borderRadius: '14px',
          width: '100%',
          maxWidth: '460px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-main, #0f172a)' }}>
            📥 Opțiuni Export Date ({listings.length} anunțuri)
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 0, fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}
          >
            ×
          </button>
        </div>

        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted, #64748b)' }}>
          Alegeți formatul de export dorit pentru lista selectată:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
          <button
            onClick={() => {
              downloadCsvReport(listings, 'vatrio-raport.csv');
              onClose();
            }}
            style={{
              padding: '16px',
              borderRadius: '10px',
              border: '1px solid var(--button-border, #cbd5e1)',
              background: 'var(--button-bg, #f8fafc)',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <span style={{ fontWeight: 700, fontSize: '14px', color: '#1a73e8' }}>📊 CSV</span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Pentru Excel & Tabele Google</span>
          </button>

          <button
            onClick={() => {
              downloadCsvReport(listings, 'vatrio-raport-excel.csv');
              onClose();
            }}
            style={{
              padding: '16px',
              borderRadius: '10px',
              border: '1px solid var(--button-border, #cbd5e1)',
              background: 'var(--button-bg, #f8fafc)',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <span style={{ fontWeight: 700, fontSize: '14px', color: '#16a34a' }}>📗 Excel (.csv UTF-8)</span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Compatibilitate extinsă BOM</span>
          </button>

          <button
            onClick={() => {
              downloadJsonReport(listings);
              onClose();
            }}
            style={{
              padding: '16px',
              borderRadius: '10px',
              border: '1px solid var(--button-border, #cbd5e1)',
              background: 'var(--button-bg, #f8fafc)',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <span style={{ fontWeight: 700, fontSize: '14px', color: '#d97706' }}>{'{ }'} JSON</span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Format brut de date API</span>
          </button>

          <button
            onClick={() => {
              printListingsPdf(listings);
              onClose();
            }}
            style={{
              padding: '16px',
              borderRadius: '10px',
              border: '1px solid var(--button-border, #cbd5e1)',
              background: 'var(--button-bg, #f8fafc)',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <span style={{ fontWeight: 700, fontSize: '14px', color: '#dc2626' }}>🖨 Raport PDF</span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Prezentare printabilă clienți</span>
          </button>
        </div>
      </div>
    </div>
  );
};

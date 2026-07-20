import React from 'react';
import { Listing } from '../types';
import { formatPricePerSqm } from '../utils/pricePerSqm';

interface ComparisonModalProps {
  listings: Listing[];
  onClose: () => void;
  onRemoveListing?: (id: string) => void;
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({
  listings,
  onClose,
  onRemoveListing,
}) => {
  if (listings.length === 0) return null;

  const formatPrice = (listing: Listing) => {
    if (listing.price === null) return 'Nespecificat';
    return `${new Intl.NumberFormat('ro-RO').format(listing.price)} ${listing.currency ?? 'EUR'}`;
  };

  const fields: { label: string; render: (l: Listing) => React.ReactNode }[] = [
    {
      label: 'Preț total',
      render: (l) => <strong style={{ fontSize: '15px', color: '#1a73e8' }}>{formatPrice(l)}</strong>,
    },
    {
      label: 'Preț / m²',
      render: (l) => formatPricePerSqm(l.price, l.surface_sqm, l.currency) || 'N/A',
    },
    {
      label: 'Suprafață',
      render: (l) => (l.surface_sqm ? `${l.surface_sqm} m²` : 'Nespecificată'),
    },
    {
      label: 'Locație',
      render: (l) => l.location || 'Nespecificată',
    },
    {
      label: 'Tip proprietate',
      render: (l) => l.property_type || 'Apartament',
    },
    {
      label: 'Tip tranzacție',
      render: (l) => (l.transaction_type === 'sale' ? 'De vânzare' : 'De închiriat'),
    },
    {
      label: 'Vânzător',
      render: (l) =>
        l.seller_type === 'owner'
          ? 'Proprietar'
          : l.seller_type === 'agency'
          ? 'Agenție'
          : l.seller_type === 'developer'
          ? 'Dezvoltator'
          : 'Necunoscut',
    },
    {
      label: 'Sursă',
      render: (l) => l.source.toUpperCase(),
    },
    {
      label: 'Status',
      render: (l) => (
        <span
          style={{
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            background:
              l.status === 'new'
                ? '#e8f0fe'
                : l.status === 'contacted'
                ? '#fef3c7'
                : l.status === 'refused'
                ? '#fee2e2'
                : '#d1fae5',
            color:
              l.status === 'new'
                ? '#1a73e8'
                : l.status === 'contacted'
                ? '#d97706'
                : l.status === 'refused'
                ? '#dc2626'
                : '#059669',
          }}
        >
          {l.status}
        </span>
      ),
    },
    {
      label: 'Data adăugării',
      render: (l) => new Date(l.date_scraped).toLocaleDateString('ro-RO'),
    },
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        background: 'rgba(0, 0, 0, 0.75)',
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
          maxWidth: '1000px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--panel-toolbar-border, #dce2e7)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--text-main, #1e293b)' }}>
            Comparație anunțuri ({listings.length})
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 0,
              fontSize: '22px',
              cursor: 'pointer',
              color: 'var(--text-muted, #64748b)',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '24px', overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: '13px',
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    width: '160px',
                    padding: '12px',
                    borderBottom: '2px solid var(--panel-toolbar-border, #e2e8f0)',
                  }}
                >
                  Caracteristică
                </th>
                {listings.map((l) => (
                  <th
                    key={l.id}
                    style={{
                      padding: '12px',
                      borderBottom: '2px solid var(--panel-toolbar-border, #e2e8f0)',
                      minWidth: '220px',
                      verticalAlign: 'top',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {l.image_url ? (
                        <img
                          src={l.image_url}
                          alt=""
                          style={{
                            width: '100%',
                            height: '130px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '100%',
                            height: '130px',
                            background: '#f1f5f9',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#94a3b8',
                          }}
                        >
                          Fără imagine
                        </div>
                      )}
                      <strong style={{ fontSize: '14px', lineHeight: 1.3 }}>{l.title}</strong>
                      {onRemoveListing && listings.length > 2 && (
                        <button
                          onClick={() => onRemoveListing(l.id)}
                          style={{
                            background: 'transparent',
                            border: 0,
                            color: '#ef4444',
                            fontSize: '12px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            padding: 0,
                          }}
                        >
                          Elimină din comparație
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fields.map((field, idx) => (
                <tr
                  key={idx}
                  style={{
                    borderBottom: '1px solid var(--panel-toolbar-border, #f1f5f9)',
                    background: idx % 2 === 0 ? 'transparent' : 'var(--table-header-bg, #f8fafc)',
                  }}
                >
                  <td
                    style={{
                      padding: '12px',
                      fontWeight: 600,
                      color: 'var(--text-secondary, #64748b)',
                    }}
                  >
                    {field.label}
                  </td>
                  {listings.map((l) => (
                    <td key={l.id} style={{ padding: '12px', color: 'var(--text-main, #334155)' }}>
                      {field.render(l)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

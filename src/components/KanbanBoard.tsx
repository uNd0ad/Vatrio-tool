import React from 'react';
import { Listing, ListingStatus } from '../types';

interface KanbanBoardProps {
  listings: Listing[];
  onStatusChange?: (listingId: string, newStatus: ListingStatus) => void;
  onSelectListing?: (listing: Listing) => void;
}

const COLUMNS: { id: ListingStatus; title: string; color: string }[] = [
  { id: 'new', title: 'New Listings', color: '#3b82f6' },
  { id: 'contacted', title: 'Contacted', color: '#f59e0b' },
  { id: 'refused', title: 'Refused', color: '#ef4444' },
  { id: 'closed', title: 'Closed / Deal', color: '#10b981' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ listings, onStatusChange, onSelectListing }) => {
  return (
    <div
      className="kanban-board"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(240px, 1fr))',
        gap: '16px',
        height: '100%',
        overflowX: 'auto',
        padding: '4px',
      }}
    >
      {COLUMNS.map((col) => {
        const colListings = listings.filter((l) => l.status === col.id);

        return (
          <div
            key={col.id}
            className="kanban-column"
            style={{
              background: '#f8fafc',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '100%',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                borderBottom: `3px solid ${col.color}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontWeight: 600,
              }}
            >
              <span>{col.title}</span>
              <span
                style={{
                  background: '#e2e8f0',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                }}
              >
                {colListings.length}
              </span>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              {colListings.map((listing) => (
                <div
                  key={listing.id}
                  className="kanban-card"
                  onClick={() => onSelectListing?.(listing)}
                  style={{
                    background: '#ffffff',
                    padding: '12px',
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    border: '1px solid #cbd5e1',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px', color: '#1e293b' }}>
                    {listing.title}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '8px' }}>
                    📍 {listing.location || 'N/A'} • {listing.price ? `${listing.price} €` : 'Price N/A'}
                  </div>

                  <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                    {COLUMNS.filter((c) => c.id !== col.id).map((targetCol) => (
                      <button
                        key={targetCol.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onStatusChange?.(listing.id, targetCol.id);
                        }}
                        style={{
                          fontSize: '0.7rem',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          border: '1px solid #cbd5e1',
                          background: '#f1f5f9',
                          cursor: 'pointer',
                        }}
                        title={`Move to ${targetCol.title}`}
                      >
                        → {targetCol.title.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

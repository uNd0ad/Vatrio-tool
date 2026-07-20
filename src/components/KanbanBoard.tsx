import React, { useState } from 'react';
import { Listing, ListingStatus } from '../types';

interface KanbanBoardProps {
  listings: Listing[];
  onStatusChange?: (listingId: string, newStatus: ListingStatus) => void;
  onSelectListing?: (listing: Listing) => void;
}

const COLUMNS: { id: ListingStatus; title: string; color: string }[] = [
  { id: 'new', title: 'Noi', color: '#3b82f6' },
  { id: 'contacted', title: 'Contactate', color: '#f59e0b' },
  { id: 'refused', title: 'Refuzate', color: '#ef4444' },
  { id: 'closed', title: 'Închise / Tranzacționate', color: '#10b981' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ listings, onStatusChange, onSelectListing }) => {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<ListingStatus | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, colId: ListingStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== colId) {
      setDragOverCol(colId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, colId: ListingStatus) => {
    e.preventDefault();
    if (dragOverCol === colId) {
      setDragOverCol(null);
    }
  };

  const handleDrop = (e: React.DragEvent, colId: ListingStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    const listingId = e.dataTransfer.getData('text/plain') || draggedId;
    if (listingId) {
      onStatusChange?.(listingId, colId);
    }
    setDraggedId(null);
  };

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
        const isOver = dragOverCol === col.id;

        return (
          <div
            key={col.id}
            className="kanban-column"
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={(e) => handleDragLeave(e, col.id)}
            onDrop={(e) => handleDrop(e, col.id)}
            style={{
              background: isOver ? 'var(--sidebar-nav-active-bg, #eff6ff)' : 'var(--table-header-bg, #f8fafc)',
              borderRadius: '10px',
              border: isOver ? `2px dashed ${col.color}` : '1px solid var(--panel-toolbar-border, #e2e8f0)',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '100%',
              transition: 'all 0.15s ease',
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
                color: 'var(--text-main, #0f172a)',
              }}
            >
              <span>{col.title}</span>
              <span
                style={{
                  background: 'var(--button-bg, #e2e8f0)',
                  color: 'var(--button-color, #475569)',
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
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, listing.id)}
                  onClick={() => onSelectListing?.(listing)}
                  style={{
                    background: 'var(--card-bg, #ffffff)',
                    padding: '12px',
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    border: '1px solid var(--panel-toolbar-border, #cbd5e1)',
                    cursor: 'grab',
                    opacity: draggedId === listing.id ? 0.4 : 1,
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px', color: 'var(--text-main, #1e293b)' }}>
                    {listing.title}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)', marginBottom: '8px' }}>
                    📍 {listing.location || 'Nespecificată'} • {listing.price ? `${listing.price} €` : 'Nespecificat'}
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
                          border: '1px solid var(--button-border, #cbd5e1)',
                          background: 'var(--button-bg, #f1f5f9)',
                          color: 'var(--button-color, #334155)',
                          cursor: 'pointer',
                        }}
                        title={`Mută în ${targetCol.title}`}
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

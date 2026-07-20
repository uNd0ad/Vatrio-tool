import React, { useEffect, useRef } from 'react';
import { Listing, ListingStatus } from '../types';

interface ContextMenuProps {
  x: number;
  y: number;
  listing: Listing;
  isStarred: boolean;
  onClose: () => void;
  onOpenDetails: (listing: Listing) => void;
  onToggleStar: (id: string) => void;
  onStatusChange: (id: string, status: ListingStatus) => void;
  onOpenExternal: (url: string) => void;
  onDelete: (id: string) => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  listing,
  isStarred,
  onClose,
  onOpenDetails,
  onToggleStar,
  onStatusChange,
  onOpenExternal,
  onDelete,
}) => {
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const menuItemStyle: React.CSSProperties = {
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--text-main, #1e293b)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    borderRadius: '6px',
    transition: 'background 0.15s ease',
  };

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: `${y}px`,
        left: `${x}px`,
        zIndex: 3000,
        background: 'var(--card-bg, #ffffff)',
        border: '1px solid var(--panel-toolbar-border, #dce2e7)',
        borderRadius: '10px',
        padding: '6px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
        minWidth: '180px',
      }}
    >
      <div
        style={menuItemStyle}
        onClick={() => {
          onOpenDetails(listing);
          onClose();
        }}
      >
        👁 Vezi detalii
      </div>

      <div
        style={menuItemStyle}
        onClick={() => {
          onToggleStar(listing.id);
          onClose();
        }}
      >
        {isStarred ? '★ Elimină din favorite' : '☆ Adaugă la favorite'}
      </div>

      <div
        style={menuItemStyle}
        onClick={() => {
          onOpenExternal(listing.listing_url);
          onClose();
        }}
      >
        ↗ Deschide anunțul original
      </div>

      <div
        style={menuItemStyle}
        onClick={() => {
          void navigator.clipboard.writeText(listing.listing_url);
          onClose();
        }}
      >
        📋 Copiază linkul
      </div>

      <div style={{ height: '1px', background: 'var(--panel-toolbar-border, #e2e8f0)', margin: '4px 0' }} />

      <div style={{ padding: '4px 14px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted, #94a3b8)' }}>
        SCHIMBĂ STATUS
      </div>

      {(['new', 'contacted', 'refused', 'closed'] as ListingStatus[]).map((st) => (
        <div
          key={st}
          style={{
            ...menuItemStyle,
            paddingLeft: '20px',
            fontSize: '12px',
            fontWeight: listing.status === st ? 700 : 500,
            color: listing.status === st ? '#1a73e8' : 'var(--text-main, #334155)',
          }}
          onClick={() => {
            onStatusChange(listing.id, st);
            onClose();
          }}
        >
          {st === 'new' ? '● Nou' : st === 'contacted' ? '◐ Contactat' : st === 'refused' ? '× Refuzat' : '✓ Închis'}
        </div>
      ))}

      <div style={{ height: '1px', background: 'var(--panel-toolbar-border, #e2e8f0)', margin: '4px 0' }} />

      <div
        style={{ ...menuItemStyle, color: '#ef4444' }}
        onClick={() => {
          onDelete(listing.id);
          onClose();
        }}
      >
        🗑 Șterge
      </div>
    </div>
  );
};

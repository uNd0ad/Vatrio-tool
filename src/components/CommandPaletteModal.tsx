import React, { useState, useEffect, useRef } from 'react';
import { Listing } from '../types';

interface CommandItem {
  id: string;
  label: string;
  category: 'Acțiune' | 'Anunț';
  action: () => void;
  icon?: string;
}

interface CommandPaletteModalProps {
  onClose: () => void;
  listings: Listing[];
  onSelectListing: (listing: Listing) => void;
  onNavigateView: (view: 'listings' | 'board' | 'map' | 'analytics') => void;
  onOpenSettings: () => void;
  onToggleTheme: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  onClose,
  listings,
  onSelectListing,
  onNavigateView,
  onOpenSettings,
  onToggleTheme,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const commandItems = React.useMemo<CommandItem[]>(() => {
    const items: CommandItem[] = [
      {
        id: 'cmd-listings',
        label: 'Mergi la Panou general anunțuri',
        category: 'Acțiune',
        icon: '📋',
        action: () => {
          onNavigateView('listings');
          onClose();
        },
      },
      {
        id: 'cmd-board',
        label: 'Mergi la Panou Kanban',
        category: 'Acțiune',
        icon: '📊',
        action: () => {
          onNavigateView('board');
          onClose();
        },
      },
      {
        id: 'cmd-map',
        label: 'Mergi la Hartă interactivă',
        category: 'Acțiune',
        icon: '📍',
        action: () => {
          onNavigateView('map');
          onClose();
        },
      },
      {
        id: 'cmd-analytics',
        label: 'Mergi la Analiză vizuală',
        category: 'Acțiune',
        icon: '📈',
        action: () => {
          onNavigateView('analytics');
          onClose();
        },
      },
      {
        id: 'cmd-settings',
        label: 'Deschide setările aplicației',
        category: 'Acțiune',
        icon: '⚙',
        action: () => {
          onOpenSettings();
          onClose();
        },
      },
      {
        id: 'cmd-theme',
        label: 'Comută tema luminos / întunecat',
        category: 'Acțiune',
        icon: '🌓',
        action: () => {
          onToggleTheme();
          onClose();
        },
      },
    ];

    const searchStr = query.toLowerCase().trim();
    if (!searchStr) return items;

    const filteredActions = items.filter((item) => item.label.toLowerCase().includes(searchStr));

    const matchedListings: CommandItem[] = listings
      .filter(
        (l) =>
          l.title.toLowerCase().includes(searchStr) ||
          (l.location && l.location.toLowerCase().includes(searchStr))
      )
      .slice(0, 8)
      .map((l) => ({
        id: `listing-${l.id}`,
        label: `${l.title} (${l.price ? `${l.price} €` : 'Nespecificat'})`,
        category: 'Anunț',
        icon: '🏠',
        action: () => {
          onSelectListing(l);
          onClose();
        },
      }));

    return [...filteredActions, ...matchedListings];
  }, [query, listings, onNavigateView, onOpenSettings, onToggleTheme, onSelectListing, onClose]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < commandItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : commandItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (commandItems[selectedIndex]) {
        commandItems[selectedIndex].action();
      }
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 3000,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--card-bg, #ffffff)',
          border: '1px solid var(--panel-toolbar-border, #dce2e7)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '620px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--panel-toolbar-border, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '18px', color: '#94a3b8' }}>🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tastați o comandă sau căutați un anunț... (Esc pentru închidere)"
            style={{
              width: '100%',
              border: 0,
              outline: 'none',
              fontSize: '15px',
              fontWeight: 500,
              background: 'transparent',
              color: 'var(--text-main, #0f172a)',
            }}
          />
        </div>

        <div style={{ maxHeight: '360px', overflowY: 'auto', padding: '8px' }}>
          {commandItems.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
              Niciun rezultat găsit pentru "{query}"
            </div>
          ) : (
            commandItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: isSelected
                      ? 'var(--sidebar-nav-active-bg, #eff6ff)'
                      : 'transparent',
                    color: isSelected ? '#1a73e8' : 'var(--text-main, #1e293b)',
                    fontWeight: isSelected ? 600 : 500,
                    fontSize: '13px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>{item.icon || '⚡'}</span>
                    <span>{item.label}</span>
                  </div>
                  <span
                    style={{
                      fontSize: '10px',
                      textTransform: 'uppercase',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'var(--button-bg, #f1f5f9)',
                      color: 'var(--text-muted, #64748b)',
                    }}
                  >
                    {item.category}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

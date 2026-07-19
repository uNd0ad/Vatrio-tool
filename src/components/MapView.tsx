import React, { useState, useMemo } from 'react';
import { Listing } from '../types';

interface MapViewProps {
  listings: Listing[];
  onSelectListing?: (listing: Listing) => void;
}

export const MapView: React.FC<MapViewProps> = ({ listings, onSelectListing }) => {
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [activeZoneFilter, setActiveZoneFilter] = useState<string>('all');

  // Filter listings with valid coordinates or zone labels
  const mappedListings = useMemo(() => {
    return listings.filter((l) => {
      const matchesZone = activeZoneFilter === 'all' || l.location?.toLowerCase().includes(activeZoneFilter.toLowerCase());
      return matchesZone && (l.latitude != null || l.location != null);
    });
  }, [listings, activeZoneFilter]);

  // Extract unique zones for quick filter chips
  const zones = useMemo(() => {
    const set = new Set<string>();
    listings.forEach((l) => {
      if (l.location) {
        const primaryZone = l.location.split(',')[0].trim();
        if (primaryZone) set.add(primaryZone);
      }
    });
    return Array.from(set).slice(0, 10);
  }, [listings]);

  // Bounding box for relative SVG placement
  const bounds = useMemo(() => {
    const withCoords = mappedListings.filter((l) => l.latitude != null && l.longitude != null);
    if (withCoords.length === 0) {
      return { minLat: 44.0, maxLat: 47.5, minLng: 20.5, maxLng: 28.5 };
    }
    const lats = withCoords.map((l) => l.latitude!);
    const lngs = withCoords.map((l) => l.longitude!);
    return {
      minLat: Math.min(...lats) - 0.02,
      maxLat: Math.max(...lats) + 0.02,
      minLng: Math.min(...lngs) - 0.02,
      maxLng: Math.max(...lngs) + 0.02,
    };
  }, [mappedListings]);

  const projectPoint = (lat: number, lng: number) => {
    const latSpan = Math.max(bounds.maxLat - bounds.minLat, 0.01);
    const lngSpan = Math.max(bounds.maxLng - bounds.minLng, 0.01);
    const x = ((lng - bounds.minLng) / lngSpan) * 100;
    const y = 100 - ((lat - bounds.minLat) / latSpan) * 100;
    return { x: Math.min(95, Math.max(5, x)), y: Math.min(95, Math.max(5, y)) };
  };

  return (
    <div className="map-view-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px' }}>
      <div className="map-controls" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Zone Filter:</span>
        <button
          className={`btn-chip ${activeZoneFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveZoneFilter('all')}
          style={{ padding: '4px 10px', borderRadius: '14px', border: '1px solid #ccc', background: activeZoneFilter === 'all' ? '#007aff' : '#f0f0f0', color: activeZoneFilter === 'all' ? '#fff' : '#333' }}
        >
          All ({listings.length})
        </button>
        {zones.map((zone) => (
          <button
            key={zone}
            className={`btn-chip ${activeZoneFilter === zone ? 'active' : ''}`}
            onClick={() => setActiveZoneFilter(zone)}
            style={{ padding: '4px 10px', borderRadius: '14px', border: '1px solid #ccc', background: activeZoneFilter === zone ? '#007aff' : '#f0f0f0', color: activeZoneFilter === zone ? '#fff' : '#333' }}
          >
            {zone}
          </button>
        ))}
      </div>

      <div
        className="map-canvas-wrapper"
        style={{
          position: 'relative',
          flex: 1,
          minHeight: '400px',
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid #334155',
        }}
      >
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0 }}>
          {/* Gridlines */}
          {[20, 40, 60, 80].map((gridLine) => (
            <React.Fragment key={gridLine}>
              <line x1="0" y1={gridLine} x2="100" y2={gridLine} stroke="#334155" strokeDasharray="1,1" strokeWidth="0.3" />
              <line x1={gridLine} y1="0" x2={gridLine} y2="100" stroke="#334155" strokeDasharray="1,1" strokeWidth="0.3" />
            </React.Fragment>
          ))}
        </svg>

        {mappedListings.map((listing, index) => {
          const lat = listing.latitude ?? bounds.minLat + (index * 0.05) % (bounds.maxLat - bounds.minLat);
          const lng = listing.longitude ?? bounds.minLng + (index * 0.05) % (bounds.maxLng - bounds.minLng);
          const { x, y } = projectPoint(lat, lng);
          const isSelected = selectedListing?.id === listing.id;

          return (
            <div
              key={listing.id}
              onClick={() => {
                setSelectedListing(listing);
                onSelectListing?.(listing);
              }}
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)',
                cursor: 'pointer',
                zIndex: isSelected ? 10 : 2,
                transition: 'transform 0.15s ease',
              }}
              title={`${listing.title} — ${listing.price ? `${listing.price} ${listing.currency || 'EUR'}` : 'N/A'}`}
            >
              <div
                style={{
                  padding: '3px 8px',
                  borderRadius: '12px',
                  background: isSelected ? '#ef4444' : '#3b82f6',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  boxShadow: isSelected ? '0 0 12px rgba(239,68,68,0.8)' : '0 2px 6px rgba(0,0,0,0.4)',
                  border: '1.5px solid #ffffff',
                }}
              >
                📍 {listing.price ? `${listing.price} €` : 'Prop'}
              </div>
            </div>
          );
        })}

        {selectedListing && (
          <div
            className="map-popup-card"
            style={{
              position: 'absolute',
              bottom: '16px',
              left: '16px',
              right: '16px',
              maxWidth: '360px',
              background: '#1e293b',
              color: '#f8fafc',
              padding: '14px',
              borderRadius: '10px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              border: '1px solid #475569',
              zIndex: 20,
            }}
          >
            <button
              onClick={() => setSelectedListing(null)}
              style={{ position: 'absolute', top: '8px', right: '8px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1rem' }}
            >
              ✕
            </button>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', color: '#60a5fa' }}>{selectedListing.title}</h4>
            <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '4px' }}>
              📍 {selectedListing.location || 'Unknown location'}
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#34d399', marginBottom: '8px' }}>
              {selectedListing.price ? `${selectedListing.price} ${selectedListing.currency || 'EUR'}` : 'Price on request'}
              {selectedListing.surface_sqm ? ` • ${selectedListing.surface_sqm} m²` : ''}
            </div>
            <a
              href={selectedListing.listing_url}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: '0.8rem', color: '#38bdf8', textDecoration: 'underline' }}
            >
              View original listing →
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

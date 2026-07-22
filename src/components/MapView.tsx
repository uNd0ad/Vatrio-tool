import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Listing } from "../types";
import { formatPrice } from "../utils/format";
import { boundsOf, clusterListings, splitByGeolocation, type MapCluster } from "../utils/mapClusters";

interface MapViewProps {
  listings: Listing[];
  onSelectListing?: (listing: Listing) => void;
}

const TIMISOARA: L.LatLngExpression = [45.7537, 21.2257];

function clusterIcon(cluster: MapCluster, isActive: boolean): L.DivIcon {
  const count = cluster.listings.length;
  const label = count === 1 ? formatPrice(cluster.listings[0]).replace(/\s+/g, " ") : String(count);
  const size = count === 1 ? 0 : Math.min(46, 30 + String(count).length * 6);
  const background = isActive ? "#ef4444" : count === 1 ? "#1a73e8" : "#7c3aed";

  return L.divIcon({
    className: "vatrio-map-marker",
    html: `<span style="
      display:inline-flex;align-items:center;justify-content:center;
      background:${background};color:#fff;font-weight:700;font-size:11px;
      padding:${count === 1 ? "4px 9px" : "0"};
      ${count === 1 ? "" : `width:${size}px;height:${size}px;`}
      border-radius:${count === 1 ? "13px" : "50%"};
      border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);
      white-space:nowrap;">${label}</span>`,
    iconSize: count === 1 ? [0, 0] : [size, size],
    iconAnchor: count === 1 ? [0, 0] : [size / 2, size / 2],
  });
}

export function MapView({ listings, onSelectListing }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const [activeCluster, setActiveCluster] = useState<MapCluster | null>(null);

  const { located, missingCoordinates } = useMemo(() => splitByGeolocation(listings), [listings]);
  const clusters = useMemo(() => clusterListings(located), [located]);

  // Inițializează harta o singură dată; instanțele Leaflet nu se remontează.
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;
    const map = L.map(containerRef.current, { center: TIMISOARA, zoom: 12, scrollWheelZoom: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    markerLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
    };
  }, []);

  // Harta e montată într-un container care poate fi ascuns la primul render
  // (tab inactiv); fără invalidateSize tile-urile rămân gri până la un resize.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const timer = setTimeout(() => map.invalidateSize(), 50);
    return () => clearTimeout(timer);
  }, [listings.length]);

  useEffect(() => {
    const map = mapRef.current;
    const layer = markerLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    for (const cluster of clusters) {
      L.marker([cluster.latitude, cluster.longitude], {
        icon: clusterIcon(cluster, activeCluster?.id === cluster.id),
        title: cluster.listings.length === 1
          ? cluster.listings[0].title
          : `${cluster.listings.length} anunțuri în această zonă`,
      })
        .on("click", () => setActiveCluster(cluster))
        .addTo(layer);
    }

    const bounds = boundsOf(clusters);
    if (bounds) {
      map.fitBounds([bounds.southWest, bounds.northEast], { padding: [48, 48], maxZoom: 15 });
    }
  }, [clusters, activeCluster]);

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: "10px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", fontSize: "12px", color: "var(--text-secondary)" }}>
        <strong style={{ color: "var(--text-main)" }}>
          {located.length} {located.length === 1 ? "anunț localizat" : "anunțuri localizate"}
        </strong>
        {clusters.length > 0 && <span>în {clusters.length} {clusters.length === 1 ? "zonă" : "zone"}</span>}
        {missingCoordinates.length > 0 && (
          <span title="Aceste anunțuri nu au coordonate în baza de date și nu pot fi plasate pe hartă.">
            · {missingCoordinates.length} fără coordonate (neafișate)
          </span>
        )}
      </div>

      <div style={{ position: "relative", flex: 1, minHeight: "520px", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--panel-toolbar-border, #dce2e7)" }}>
        <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />

        {located.length === 0 && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 500, display: "grid", placeItems: "center",
            background: "rgba(15,23,42,.72)", color: "#f8fafc", textAlign: "center", padding: "24px",
          }}>
            <div>
              <h3 style={{ margin: "0 0 6px", fontSize: "15px" }}>Niciun anunț cu coordonate</h3>
              <p style={{ margin: 0, fontSize: "13px", opacity: .85, maxWidth: "420px" }}>
                {listings.length === 0
                  ? "Nu există anunțuri în filtrul curent."
                  : `Cele ${listings.length} anunțuri din filtrul curent nu au coordonate salvate. Ele se completează automat la următoarea rulare a crawlerului.`}
              </p>
            </div>
          </div>
        )}

        {activeCluster && (
          <div style={{
            position: "absolute", bottom: "16px", left: "16px", zIndex: 1000, width: "min(380px, calc(100% - 32px))",
            maxHeight: "46%", overflowY: "auto", background: "var(--card-bg, #fff)", color: "var(--text-main)",
            padding: "14px", borderRadius: "10px", boxShadow: "0 8px 24px rgba(0,0,0,.25)",
            border: "1px solid var(--panel-toolbar-border, #dce2e7)",
          }}>
            <button
              onClick={() => setActiveCluster(null)}
              aria-label="Închide"
              style={{ position: "absolute", top: "8px", right: "10px", background: "transparent", border: 0, color: "var(--text-muted)", cursor: "pointer", fontSize: "15px" }}
            >
              ✕
            </button>
            {activeCluster.listings.length > 1 && (
              <p style={{ margin: "0 0 10px", fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)" }}>
                {activeCluster.listings.length} anunțuri la această poziție
              </p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {activeCluster.listings.map((listing) => (
                <button
                  key={listing.id}
                  onClick={() => onSelectListing?.(listing)}
                  style={{
                    textAlign: "left", background: "transparent", border: 0, padding: 0,
                    cursor: onSelectListing ? "pointer" : "default", color: "inherit",
                  }}
                >
                  <strong style={{ display: "block", fontSize: "13px", color: "#1a73e8" }}>{listing.title}</strong>
                  <span style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)" }}>
                    {listing.location ?? "Locație nespecificată"}
                  </span>
                  <span style={{ display: "block", fontSize: "12px", fontWeight: 700 }}>
                    {formatPrice(listing)}
                    {listing.surface_sqm ? ` · ${listing.surface_sqm} m²` : ""}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

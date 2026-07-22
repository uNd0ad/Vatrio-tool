import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import type { Listing } from "../types";
import { formatPrice } from "../utils/format";
import { boundsOf, clusterListings, splitByGeolocation } from "../utils/mapClusters";

interface MapViewProps {
  listings: Listing[];
  onSelectListing?: (listing: Listing) => void;
}

const TIMISOARA: L.LatLngExpression = [45.7537, 21.2257];

function priceLabel(listing: Listing): string {
  if (listing.price === null) return "Preț n/a";
  return `${new Intl.NumberFormat("ro-RO", { notation: "compact", maximumFractionDigits: 1 }).format(listing.price)} ${listing.currency ?? "EUR"}`;
}

function listingIcon(listing: Listing): L.DivIcon {
  return L.divIcon({
    className: "vatrio-map-marker",
    html: `<span style="
      display:inline-block;background:#1a73e8;color:#fff;font-weight:700;
      font-size:11px;padding:4px 9px;border-radius:13px;border:2px solid #fff;
      box-shadow:0 2px 8px rgba(0,0,0,.35);white-space:nowrap;
      transform:translate(-50%,-50%);">${priceLabel(listing)}</span>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function clusterIcon(cluster: L.MarkerCluster): L.DivIcon {
  const count = cluster.getChildCount();
  const size = Math.min(52, 32 + String(count).length * 6);
  // Grupurile mari sunt aproape sigur anunțuri geocodate la centrul orașului
  // (cartier necunoscut), nu o concentrare reală — culoarea le distinge.
  const background = count >= 50 ? "#7c3aed" : count >= 10 ? "#2563eb" : "#1a73e8";
  return L.divIcon({
    className: "vatrio-map-cluster",
    html: `<span style="
      display:flex;align-items:center;justify-content:center;
      width:${size}px;height:${size}px;border-radius:50%;
      background:${background};color:#fff;font-weight:700;font-size:12px;
      border:2px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.4);">${count}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function MapView({ listings, onSelectListing }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const onSelectRef = useRef(onSelectListing);
  onSelectRef.current = onSelectListing;

  const { located, missingCoordinates } = useMemo(() => splitByGeolocation(listings), [listings]);
  const distinctPoints = useMemo(() => clusterListings(located), [located]);

  // Inițializează harta o singură dată; instanțele Leaflet nu se remontează.
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;
    const map = L.map(containerRef.current, { center: TIMISOARA, zoom: 12, scrollWheelZoom: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const clusterGroup = L.markerClusterGroup({
      iconCreateFunction: clusterIcon,
      // Grupurile se desfac pe măsură ce se apropie; la zoom maxim anunțurile
      // care împart exact aceeași coordonată se despart în evantai, singurul
      // mod de a le separa când geocodarea le-a dat același punct.
      spiderfyOnMaxZoom: true,
      spiderfyDistanceMultiplier: 1.3,
      zoomToBoundsOnClick: true,
      showCoverageOnHover: false,
      maxClusterRadius: 45,
      // Fără `disableClusteringAtZoom`: anunțurile care împart exact aceeași
      // coordonată s-ar suprapune pixel-perfect și ar arăta ca unul singur.
      // Păstrând gruparea până la zoom maxim, clic pe grup le desface în evantai.
    });
    clusterGroup.addTo(map);

    mapRef.current = map;
    clusterGroupRef.current = clusterGroup;
    return () => {
      map.remove();
      mapRef.current = null;
      clusterGroupRef.current = null;
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
    const clusterGroup = clusterGroupRef.current;
    if (!map || !clusterGroup) return;

    clusterGroup.clearLayers();
    const markers = located.map((listing) =>
      L.marker([listing.latitude!, listing.longitude!], {
        icon: listingIcon(listing),
        title: listing.title,
      })
        .bindTooltip(
          `<strong>${listing.title}</strong><br/>${listing.location ?? "Locație nespecificată"}<br/>${formatPrice(listing)}${listing.surface_sqm ? ` · ${listing.surface_sqm} m²` : ""}`,
          { direction: "top", offset: [0, -12] }
        )
        .on("click", () => onSelectRef.current?.(listing))
    );
    clusterGroup.addLayers(markers);

    const bounds = boundsOf(distinctPoints);
    if (bounds) {
      map.fitBounds([bounds.southWest, bounds.northEast], { padding: [48, 48], maxZoom: 15 });
    }
  }, [located, distinctPoints]);

  return (
    // flex:1 + minHeight:0 lasă harta să umple containerul părinte pe toată
    // înălțimea; fără ele coloana se strânge la minHeight-ul hărții.
    <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: "10px", flex: 1, minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", fontSize: "12px", color: "var(--text-secondary)" }}>
        <strong style={{ color: "var(--text-main)" }}>
          {located.length} {located.length === 1 ? "anunț localizat" : "anunțuri localizate"}
        </strong>
        {distinctPoints.length > 0 && (
          <span>în {distinctPoints.length} {distinctPoints.length === 1 ? "punct" : "puncte"} distincte</span>
        )}
        {missingCoordinates.length > 0 && (
          <span title="Aceste anunțuri nu au coordonate în baza de date și nu pot fi plasate pe hartă.">
            · {missingCoordinates.length} fără coordonate (neafișate)
          </span>
        )}
        <span style={{ marginLeft: "auto", opacity: .8 }}>
          Apropie pentru a desface grupurile · clic pe un anunț pentru detalii
        </span>
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
      </div>
    </div>
  );
}

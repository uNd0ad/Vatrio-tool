import type { Listing } from "../types";

export interface MapCluster {
  /** Cheie stabilă: coordonatele rotunjite care definesc grupul. */
  id: string;
  latitude: number;
  longitude: number;
  listings: Listing[];
}

export interface GeolocatedSplit {
  located: Listing[];
  missingCoordinates: Listing[];
}

function hasCoordinates(listing: Listing): boolean {
  return (
    typeof listing.latitude === "number" &&
    Number.isFinite(listing.latitude) &&
    typeof listing.longitude === "number" &&
    Number.isFinite(listing.longitude) &&
    Math.abs(listing.latitude) <= 90 &&
    Math.abs(listing.longitude) <= 180
  );
}

/**
 * Separă anunțurile care pot fi plasate pe hartă de cele fără coordonate
 * utilizabile. Cele din urmă NU primesc poziții inventate — sunt raportate
 * separat, ca să nu pară că sunt localizate.
 */
export function splitByGeolocation(listings: Listing[]): GeolocatedSplit {
  const located: Listing[] = [];
  const missingCoordinates: Listing[] = [];
  for (const listing of listings) {
    (hasCoordinates(listing) ? located : missingCoordinates).push(listing);
  }
  return { located, missingCoordinates };
}

/**
 * Grupează anunțurile care cad pe (aproape) aceeași coordonată. Geocodarea
 * rezolvă multe anunțuri la centrul orașului sau al cartierului, deci fără
 * grupare markerele s-ar suprapune perfect și ar părea unul singur.
 */
export function clusterListings(listings: Listing[], precision = 4): MapCluster[] {
  const groups = new Map<string, MapCluster>();
  for (const listing of listings) {
    if (!hasCoordinates(listing)) continue;
    const lat = listing.latitude!;
    const lng = listing.longitude!;
    const id = `${lat.toFixed(precision)},${lng.toFixed(precision)}`;
    const existing = groups.get(id);
    if (existing) {
      existing.listings.push(listing);
    } else {
      groups.set(id, { id, latitude: lat, longitude: lng, listings: [listing] });
    }
  }
  return Array.from(groups.values()).sort((a, b) => b.listings.length - a.listings.length);
}

export interface MapBounds {
  southWest: [number, number];
  northEast: [number, number];
}

/** Cadrul care cuprinde toate punctele; null când nu există niciun punct. */
export function boundsOf(clusters: MapCluster[]): MapBounds | null {
  if (clusters.length === 0) return null;
  const lats = clusters.map((c) => c.latitude);
  const lngs = clusters.map((c) => c.longitude);
  return {
    southWest: [Math.min(...lats), Math.min(...lngs)],
    northEast: [Math.max(...lats), Math.max(...lngs)],
  };
}

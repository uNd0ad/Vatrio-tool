export interface Coordinates {
  latitude: number | null;
  longitude: number | null;
}

// Known center coordinates for major Romanian zones / neighborhoods.
const ZONE_COORDINATES_MAP: Record<string, { lat: number; lng: number }> = {
  // Timișoara zones
  "complex studentesc": { lat: 45.7467, lng: 21.2428 },
  girocului: { lat: 45.7325, lng: 21.2312 },
  fabric: { lat: 45.7578, lng: 21.2489 },
  soarelui: { lat: 45.7371, lng: 21.2464 },
  lipovei: { lat: 45.7761, lng: 21.2386 },
  aradului: { lat: 45.7778, lng: 21.2214 },
  sagului: { lat: 45.7339, lng: 21.2017 },
  mehala: { lat: 45.7681, lng: 21.2056 },
  dacia: { lat: 45.7644, lng: 21.2225 },

  // București zones
  floreasca: { lat: 44.4639, lng: 26.1028 },
  militari: { lat: 44.4356, lng: 26.0022 },
  titan: { lat: 44.4239, lng: 26.1664 },
  pipera: { lat: 44.4922, lng: 26.1194 },
  pantelimon: { lat: 44.4444, lng: 26.1639 },
  berceni: { lat: 44.3833, lng: 26.1167 },
  "drumul taberei": { lat: 44.4222, lng: 26.0278 },
  victoriei: { lat: 44.4531, lng: 26.0858 },
};

// Known center coordinates for major Romanian cities.
const CITY_COORDINATES_MAP: Record<string, { lat: number; lng: number }> = {
  timisoara: { lat: 45.7537, lng: 21.2257 },
  bucuresti: { lat: 44.4323, lng: 26.1063 },
  bucharest: { lat: 44.4323, lng: 26.1063 },
  cluj: { lat: 46.7712, lng: 23.6236 },
  "cluj-napoca": { lat: 46.7712, lng: 23.6236 },
  iasi: { lat: 47.1585, lng: 27.6014 },
  brasov: { lat: 45.6580, lng: 25.6012 },
  constanta: { lat: 44.1792, lng: 28.6498 },
  craiova: { lat: 44.3302, lng: 23.7949 },
  oradea: { lat: 47.0515, lng: 21.9409 },
  arad: { lat: 46.1866, lng: 21.3123 },
  sibiu: { lat: 45.7983, lng: 24.1256 },
  galati: { lat: 45.4353, lng: 28.0080 },
  ploiesti: { lat: 44.9367, lng: 26.0129 },
  unirii: { lat: 45.7580, lng: 21.2289 },
};

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Attempts to parse explicit lat/lng coordinates embedded in raw string (e.g. "45.7537, 21.2257").
 */
function extractExplicitCoordinates(location: string): Coordinates | null {
  const coordRegex = /(-?\d{1,2}\.\d+)[,\s;]+(-?\d{1,3}\.\d+)/;
  const match = location.match(coordRegex);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { latitude: lat, longitude: lng };
    }
  }
  return null;
}

/**
 * Geocodes a location string into WGS84 lat/lng coordinates.
 * Neighborhood/zone matches take priority over broad city-level coordinates.
 */
export function geocodeLocation(location: string | null | undefined): Coordinates {
  if (!location || typeof location !== "string") {
    return { latitude: null, longitude: null };
  }

  const explicit = extractExplicitCoordinates(location);
  if (explicit) {
    return explicit;
  }

  const normalized = normalizeText(location);
  if (!normalized) {
    return { latitude: null, longitude: null };
  }

  // 1. Check exact or partial zone matches first (sorted by longest key first)
  const zoneKeys = Object.keys(ZONE_COORDINATES_MAP).sort((a, b) => b.length - a.length);
  for (const key of zoneKeys) {
    if (normalized === key || normalized.includes(key)) {
      const coord = ZONE_COORDINATES_MAP[key];
      return { latitude: coord.lat, longitude: coord.lng };
    }
  }

  // 2. Check exact or partial city matches next (sorted by longest key first)
  const cityKeys = Object.keys(CITY_COORDINATES_MAP).sort((a, b) => b.length - a.length);
  for (const key of cityKeys) {
    if (normalized === key || normalized.includes(key)) {
      const coord = CITY_COORDINATES_MAP[key];
      return { latitude: coord.lat, longitude: coord.lng };
    }
  }

  return { latitude: null, longitude: null };
}

/**
 * Augments a listing object with latitude and longitude coordinates.
 */
export function withGeocodedCoordinates<
  T extends { location?: string | null; latitude?: number | null; longitude?: number | null }
>(listing: T): T & Coordinates {
  const existingLat = listing.latitude ?? null;
  const existingLng = listing.longitude ?? null;

  if (existingLat !== null && existingLng !== null) {
    return {
      ...listing,
      latitude: existingLat,
      longitude: existingLng,
    };
  }

  const geocoded = geocodeLocation(listing.location);
  return {
    ...listing,
    latitude: geocoded.latitude,
    longitude: geocoded.longitude,
  };
}
